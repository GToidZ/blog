import { describe, expect, test } from "bun:test";
import { parseMarkdown } from "../core";

describe("image-annotation extension", () => {
  test("spec input example", () => {
    const input = [
      "![alt text](https://example.com/pic.png)",
      "^(400, 300): Image annotation description",
      "^(800, 800): Example of bottom-right annotation",
      "",
      "Text content",
      "^(100, 100): This is ignored and shown as plain content text",
      "",
    ].join("\n");
    const expected = [
      '<figure class="img-annotated"><img src="https://example.com/pic.png" alt="alt text"><span class="img-note" tabindex="0" style="left:400px;top:300px" aria-label="Image annotation description"><span class="img-tip">Image annotation description</span></span><span class="img-note" tabindex="0" style="left:800px;top:800px" aria-label="Example of bottom-right annotation"><span class="img-tip">Example of bottom-right annotation</span></span></figure>',
      "<p>Text content\n^(100, 100): This is ignored and shown as plain content text</p>\n",
    ].join("");
    expect(parseMarkdown(input)).toBe(expected);
  });

  test("annotation line right after text paragraph stays plain", () => {
    const input = "Text content\n^(100, 100): ignored\n";
    expect(parseMarkdown(input)).toBe(
      "<p>Text content\n^(100, 100): ignored</p>\n"
    );
  });

  test("non-numeric coords are not annotations", () => {
    const input = "![a](https://example.com/x.png)\n^(left, 5): nope\n";
    expect(parseMarkdown(input)).toBe(
      '<figure class="img-annotated"><img src="https://example.com/x.png" alt="a"></figure><p>^(left, 5): nope</p>\n'
    );
  });

  test("html-unsafe annotation text is escaped", () => {
    const input = '![a](https://example.com/x.png)\n^(5, 5): <script>alert(1)</script>\n';
    const out = parseMarkdown(input);
    expect(out).toContain('<span class="img-tip">&lt;script&gt;alert(1)&lt;/script&gt;</span>');
    expect(out).not.toContain("<script>");
  });

  test("raw <img> tag lines are NOT treated as annotation carriers (html:false)", () => {
    const input = '<img src="https://example.com/x.png">\n^(5, 5): nope\n';
    const out = parseMarkdown(input);
    expect(out).not.toContain("img-annotated");
    expect(out).not.toContain('<img src="https://example.com/x.png">');
  });
});
