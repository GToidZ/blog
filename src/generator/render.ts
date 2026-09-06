import { parseMarkdown } from "../parser/core";
import { base, esc, renderBacklinks, tagSlug, type PostMeta } from "./lib";

export interface Term {
  name: string;
  html: string; // parsed markdown
}

const FONTS =
  "https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&family=IBM+Plex+Sans:wght@400;700&family=Kanit:wght@400;700&family=LINE+Seed+JP:wght@400;700&display=swap";

const icon = (paths: string, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const ICON_TAG = icon('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><circle cx="7" cy="7" r="1"/>');
export const ICON_HASH = icon('<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>');
const ICON_X = icon('<path d="M18 6L6 18M6 6l12 12"/>');
const ICON_SUN = icon('<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>', "icon icon-sun");
const ICON_MOON = icon('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', "icon icon-moon");

const tagLink = (tag: string) => `<a href="${base}/tag/${tagSlug(tag)}/">${ICON_TAG}${esc(tag)}</a>`;

const THEME_INIT = `(()=>{const s=localStorage.getItem("theme");if(s)document.documentElement.dataset.theme=s;else if(matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.dataset.theme="dark";})();`;

interface Page {
  title: string;
  content: string;
  dialogs: Term[];
  latestHref: string;
  /** site-rooted hrefs like /entry/x — prefixed with `base` (lib.ts) at build time */
}

export function renderPage(p: Page): string {
  const dialogHtml = p.dialogs
    .map(
      (t) => `<dialog id="term-${esc(tagSlug(t.name))}" class="term-dialog">
<button class="term-close icon-btn" data-close="${esc(tagSlug(t.name))}" aria-label="Close">${ICON_X}</button>
<article>
<h2 class="term-title">${ICON_TAG}${esc(t.name)}</h2>
${t.html}
</article>
</dialog>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${base}/assets/hljs.css">
<link rel="stylesheet" href="${base}/assets/style.css">
<script>${THEME_INIT}</script>
</head>
<body>
<header class="site-header">
<nav class="site-nav">
<a href="${base}/">Home</a>
<a href="${esc(p.latestHref)}">Latest</a>
<a href="${base}/tags/">Tags</a>
</nav>
</header>
<button id="theme-toggle" class="theme-toggle icon-btn" type="button" aria-label="Switch color theme">${ICON_SUN}${ICON_MOON}</button>
<main>
${p.content}
</main>
${dialogHtml}
<script src="${base}/assets/main.js"></script>
</body>
</html>
`;
}

export function renderEntryBody(post: PostMeta, terms: Set<string>): { content: string; used: string[] } {
  // parseMarkdown output is entity-safe (html:false); backlinks resolved on rendered HTML.
  const rendered = parseMarkdown(post.body);
  const { html, used } = renderBacklinks(rendered, terms);
  return {
    content: `<article class="entry">
<header class="entry-header">
<h1 class="entry-title">${esc(post.title)}</h1>
<p class="entry-date"><time datetime="${esc(post.datetime)}">${esc(post.date)}</time></p>
${post.tags.length ? `<ul class="entry-tags">${post.tags.map((t) => `<li>${tagLink(t)}</li>`).join("")}</ul>` : ""}
</header>
<div class="entry-body">
${html}
</div>
</article>`,
    used,
  };
}

export function renderPostListItem(post: PostMeta): string {
  return `<li class="post-item">
<article>
<h2 class="post-title"><a href="${base}/entry/${esc(post.name)}/">${esc(post.title)}</a></h2>
<p class="entry-date"><time datetime="${esc(post.datetime)}">${esc(post.date)}</time></p>
${post.tags.length ? `<ul class="entry-tags">${post.tags.map((t) => `<li>${tagLink(t)}</li>`).join("")}</ul>` : ""}
</article>
</li>`;
}

export function renderIndex(posts: PostMeta[], page: number, pageCount: number): string {
  const start = page * PAGE_SIZE;
  const slice = posts.slice(start, start + PAGE_SIZE);
  const nav =
    pageCount > 1
      ? `<nav class="pagination">${page > 0 ? `<a href="${pageHref(page - 1)}">&larr; Newer</a>` : ""}${page < pageCount - 1 ? `<a href="${pageHref(page + 1)}">Older &rarr;</a>` : ""}</nav>`
      : "";
  return `${slice.length ? `<ul class="post-list">${slice.map(renderPostListItem).join("\n")}</ul>` : "<p>No posts yet.</p>"}\n${nav}`;
}

function pageHref(page: number): string {
  return page === 0 ? `${base}/` : `${base}/page/${page + 1}/`;
}

export const PAGE_SIZE = 10; // ponytail: fixed page size; make it config if 10 stops fitting
