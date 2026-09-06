import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { build } from "../index";

const FIXTURE = join(import.meta.dir, "fixture", "vault");
const DIST = join(import.meta.dir, ".tmp-dist");

describe("build (fixture vault)", () => {
  test("generates full site structure", async () => {
    await build(FIXTURE, DIST);

    const home = await Bun.file(join(DIST, "index.html")).text();
    expect(home).toContain("Hello, world!");
    expect(home).toContain("/entry/2026-09-01_20-30_hello-world/");
    expect(home).toContain("/tag/greeting/");
    // reader-local time: machine-readable datetime attr for JS to convert
    expect(home).toContain('datetime="2026-09-01T20:30:00+07:00"');
    expect(home).toContain('datetime="2026-09-02T10:00:00Z"'); // frontmatter default (filename, UTC)
    expect(home).toContain('datetime="2026-09-05T18:45:00-05:30"'); // negative half-hour offset
    // newest first
    expect(home.indexOf("second-post")).toBeLessThan(home.indexOf("hello-world"));

    // entry page: backlink in-terminology → button + dialog, out-of-terminology → plain text
    const entry = await Bun.file(join(DIST, "entry/2026-09-01_20-30_hello-world/index.html")).text();
    expect(entry).toContain('class="term" data-term="glossary-entry"');
    expect(entry).toContain('id="term-glossary-entry"');
    // terminology doc renders markdown inside modal
    expect(entry).toContain("<strong>Glossary entry</strong>");
    expect(entry).toContain("<h2>Markdown inside modal</h2>");
    expect(entry).toContain("<code>vault/terminology</code>");
    expect(entry).toContain("[[nonexistent-term]]");
    // modal: circular icon close button + term title
    expect(entry).toContain('class="term-close icon-btn"');
    expect(entry).toContain('class="term-title"');

    // entry without frontmatter → filename defaults
    const second = await Bun.file(join(DIST, "entry/2026-09-02_10-00_second-post/index.html")).text();
    expect(second).toContain("Second Post");
    expect(second).toContain("2026-09-02 10:00 UTC");

    // image post renders <img>
    const images = await Bun.file(join(DIST, "entry/2026-09-03_14-00_blogging-with-images/index.html")).text();
    expect(images).toContain('<img src="https://picsum.photos/seed/dossari-landscape/1200/640"');

    // image annotations: figure + positioned notes, plain fallback for detached lines
    const annotated = await Bun.file(join(DIST, "entry/2026-09-06_16-00_annotated-images/index.html")).text();
    expect(annotated).toContain('<figure class="img-annotated"><img src="https://picsum.photos/seed/dossari-annotated/800/450"');
    expect(annotated).toContain('class="img-note" tabindex="0" style="left:400px;top:220px"');
    expect(annotated).toContain("This is ignored and shown as plain content text");

    // tag page: divider between tag name and entries
    const tag = await Bun.file(join(DIST, "tag/greeting/index.html")).text();
    expect(tag).toContain("tag-divider");
    expect(tag).toContain("hello-world");
    const tags = await Bun.file(join(DIST, "tags/index.html")).text();
    expect(tags).toContain("/tag/greeting/");

    // assets
    const css = await Bun.file(join(DIST, "assets/style.css")).text();
    expect(css).toContain("Catppuccin");
    expect(css).toContain("float-up"); // modal animation
    const js = await Bun.file(join(DIST, "assets/main.js")).text();
    expect(js.length).toBeGreaterThan(0);
    expect(js).toContain("startViewTransition"); // circle-cutout theme switch
    expect(js).toContain("toLocaleString"); // reader-local time

    // code blocks: hljs theme css scoped per theme
    const hljsCss = await Bun.file(join(DIST, "assets/hljs.css")).text();
    expect(hljsCss).toContain(':root[data-theme="dark"] code .hljs-keyword');
    expect(hljsCss).toContain(':root:not([data-theme="dark"]) code .hljs-keyword');
  });
});
