import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseMarkdown } from "../parser/core";
import {
  base,
  esc,
  makePost,
  tagSlug,
  type PostMeta,
} from "./lib";
import {
  ICON_HASH,
  PAGE_SIZE,
  renderEntryBody,
  renderIndex,
  renderPage,
  type Term,
} from "./render";

const VAULT_DIR = process.argv[2] ?? "vault";
const DIST_DIR = process.argv[3] ?? "dist";

async function listMd(dir: string): Promise<string[]> {
  const glob = new Bun.Glob("*.md");
  const files: string[] = [];
  for await (const f of glob.scan({ cwd: dir, onlyFiles: true })) files.push(f);
  return files.sort();
}

async function loadTerms(dir: string): Promise<Map<string, Term>> {
  const terms = new Map<string, Term>();
  for (const file of await listMd(dir)) {
    const name = file.replace(/\.md$/, "");
    terms.set(name, { name, html: parseMarkdown(await Bun.file(join(dir, file)).text()) });
  }
  return terms;
}

async function loadPosts(dir: string): Promise<PostMeta[]> {
  const posts: PostMeta[] = [];
  for (const file of await listMd(dir)) {
    const post = makePost(file, await Bun.file(join(dir, file)).text());
    if (post) posts.push(post);
    // ponytail: unparsable filenames silently skipped; log them if authors hit silent omissions
  }
  // filename embeds date+time → sortKey is chronological; written-on tz parsing skipped on purpose
  return posts.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export async function build(vaultDir: string, distDir: string): Promise<void> {
  const posts = await loadPosts(join(vaultDir, "posts"));
  const termMap = await loadTerms(join(vaultDir, "terminology"));
  const termNames = new Set(termMap.keys());
  const termDialogs = (used: string[]): Term[] =>
    used.map((n) => termMap.get(n)!).filter(Boolean);

  const latestHref = posts.length > 0 ? `${base}/entry/${esc(posts[0]!.name)}/` : `${base}/`;
  const writePage = async (path: string, title: string, content: string, dialogs: Term[] = []) => {
    const file = join(distDir, path);
    mkdirSync(dirname(file), { recursive: true });
    await Bun.write(file, renderPage({ title, content, dialogs, latestHref }));
  };

  // Homepage, paginated
  const pageCount = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  for (let page = 0; page < pageCount; page++) {
    await writePage(
      page === 0 ? "index.html" : `page/${page + 1}/index.html`,
      "Home",
      renderIndex(posts, page, pageCount)
    );
  }

  // Tag pages + all-tags page
  const byTag = new Map<string, PostMeta[]>();
  for (const p of posts)
    for (const t of p.tags)
      byTag.set(t, [...(byTag.get(t) ?? []), p]);

  for (const [tag, list] of byTag) {
    await writePage(
      `tag/${tagSlug(tag)}/index.html`,
      `Tag: ${tag}`,
      `<h1 class="tag-heading">${ICON_HASH}${esc(tag)}</h1>\n<hr class="tag-divider">\n<ul class="post-list">${list.map((p) =>
        `<li class="post-item"><article><h2 class="post-title"><a href="${base}/entry/${esc(p.name)}/">${esc(p.title)}</a></h2><p class="entry-date"><time datetime="${esc(p.datetime)}">${esc(p.date)}</time></p></article></li>`
      ).join("\n")}</ul>`
    );
  }

  const tagList = [...byTag.keys()].sort((a, b) => a.localeCompare(b));
  await writePage(
    "tags/index.html",
    "Tags",
    tagList.length
      ? `<h1>Tags</h1>\n<ul class="tag-list">${tagList.map((t) => `<li><a href="${base}/tag/${tagSlug(t)}/">${esc(t)}</a> (${byTag.get(t)!.length})</li>`).join("")}</ul>`
      : "<h1>Tags</h1>\n<p>No tags yet.</p>"
  );

  // Entry pages
  for (const post of posts) {
    const { content, used } = renderEntryBody(post, termNames);
    await writePage(`entry/${esc(post.name)}/index.html`, post.title, content, termDialogs(used));
  }

  // Assets
  for (const asset of ["style.css", "main.js"]) {
    await Bun.write(join(distDir, "assets", asset), Bun.file(join(import.meta.dir, "assets", asset)));
  }

  // highlight.js theme CSS: Catppuccin Latte light / Mocha dark, scoped by data-theme
  const pkgDir = Bun.resolveSync("@catppuccin/highlightjs/package.json", import.meta.dir).replace(/package\.json$/, "");
  const scope = (css: string, sel: string) =>
    css.split("}").filter(Boolean).map((rule) => {
      const [selector, body] = rule.split("{");
      return `${sel} ${selector}{${body}}`;
    }).join("");
  const latte = await Bun.file(join(pkgDir, "css", "catppuccin-latte.css")).text();
  const mocha = await Bun.file(join(pkgDir, "css", "catppuccin-mocha.css")).text();
  await Bun.write(
    join(distDir, "assets", "hljs.css"),
    scope(latte, ':root:not([data-theme="dark"])') + scope(mocha, ':root[data-theme="dark"]')
  );
}

if (import.meta.main) {
  await build(VAULT_DIR, DIST_DIR);
  console.log(`Built site: ${DIST_DIR}`);
}
