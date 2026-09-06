import { describe, expect, test } from "bun:test";
import { parseMarkdown } from "../core";

describe("parseMarkdown (core)", () => {
  test("paragraph", () => {
    expect(parseMarkdown("hello world")).toBe("<p>hello world</p>\n");
  });

  test("heading", () => {
    expect(parseMarkdown("# Title")).toBe("<h1>Title</h1>\n");
  });

  test("raw HTML escaped when html disabled", () => {
    expect(parseMarkdown("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>\n"
    );
  });

  test("code fence preserved", () => {
    expect(parseMarkdown("```\nfoo()\n```")).toBe(
      "<pre><code class=\"hljs\">foo()\n</code></pre>\n"
    );
  });

  test("code fence with known language is highlighted", () => {
    const out = parseMarkdown("```ts\nconst x: number = 1;\n```");
    expect(out).toContain('class="hljs language-ts"');
    expect(out).toContain('<span class="hljs-keyword">const</span>');
  });

  test("code fence with unknown language falls back to escaped", () => {
    const out = parseMarkdown("```nosuchlang\nfoo & bar\n```");
    expect(out).toContain('class="hljs"');
    expect(out).toContain("foo &amp; bar");
  });
});
