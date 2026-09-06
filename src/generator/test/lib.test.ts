import { describe, expect, test } from "bun:test";
import {
  makePost,
  parseFilename,
  parseFrontmatter,
  parseWrittenOn,
  renderBacklinks,
  titleFromSlug,
} from "../lib";

describe("parseWrittenOn", () => {
  test("single and double digit offsets", () => {
    expect(parseWrittenOn("2026-09-01 20:30 UTC+7:00")).toBe("2026-09-01T20:30:00+07:00");
    expect(parseWrittenOn("2026-09-01 20:30 UTC+07:00")).toBe("2026-09-01T20:30:00+07:00");
    expect(parseWrittenOn("2026-09-01 20:30 UTC-5:30")).toBe("2026-09-01T20:30:00-05:30");
    expect(parseWrittenOn("2026-09-01 20:30")).toBe("2026-09-01T20:30:00Z"); // no tz → UTC
    expect(parseWrittenOn("garbage")).toBeNull();
  });
});

describe("parseFilename", () => {
  test("valid post filename", () => {
    const r = parseFilename("2026-09-01_20-30_hello-world.md");
    expect(r).toEqual({
      date: "2026-09-01 20:30",
      sortKey: "2026-09-01_20-30",
      name: "2026-09-01_20-30_hello-world",
      title: "Hello World",
    });
  });

  test("invalid filename returns null", () => {
    expect(parseFilename("notes.md")).toBeNull();
    expect(parseFilename("2026-09-01_2030_hello-world.md")).toBeNull(); // wrong time separator
  });
});

describe("titleFromSlug", () => {
  test("dashes to spaces, titlecase", () => {
    expect(titleFromSlug("my-first-blog-post")).toBe("My First Blog Post");
  });
});

describe("parseFrontmatter", () => {
  test("full frontmatter", () => {
    const { meta, body } = parseFrontmatter(
      "---\nwritten-on: 2026-09-01 20:30 UTC+7:00\ntitle: Hello, world!\ntags: [greeting, meta]\n---\n\nBody here.\n"
    );
    expect(meta).toEqual({
      "written-on": "2026-09-01 20:30 UTC+7:00",
      title: "Hello, world!",
      tags: ["greeting", "meta"],
    });
    expect(body).toBe("\nBody here.\n");
  });

  test("no frontmatter → empty meta, body unchanged", () => {
    const { meta, body } = parseFrontmatter("just text");
    expect(meta).toEqual({});
    expect(body).toBe("just text");
  });
});

describe("makePost defaults", () => {
  test("missing frontmatter falls back to filename (UTC)", () => {
    const p = makePost("2026-09-01_20-30_hello-world.md", "Content.");
    expect(p!.date).toBe("2026-09-01 20:30 UTC");
    expect(p!.title).toBe("Hello World");
    expect(p!.tags).toEqual([]);
    expect(p!.body).toBe("Content.");
  });

  test("frontmatter overrides filename defaults", () => {
    const p = makePost(
      "2026-09-01_20-30_hello-world.md",
      "---\ntitle: Custom Title\ntags: [a]\n---\nBody"
    );
    expect(p!.title).toBe("Custom Title");
    expect(p!.tags).toEqual(["a"]);
  });

  test("non-post file rejected", () => {
    expect(makePost("readme.md", "x")).toBeNull();
  });
});

describe("renderBacklinks", () => {
  const terms = new Set(["glossary-entry"]);

  test("in-terminology backlink becomes button", () => {
    const { html, used } = renderBacklinks("<p>See [[glossary-entry]] now.</p>", terms);
    expect(html).toBe(
      '<p>See <button class="term" data-term="glossary-entry">glossary-entry</button> now.</p>'
    );
    expect(used).toEqual(["glossary-entry"]);
  });

  test("backlink outside terminology dir stays plain text", () => {
    const { html, used } = renderBacklinks("<p>See [[not-a-term]] now.</p>", terms);
    expect(html).toBe("<p>See [[not-a-term]] now.</p>");
    expect(used).toEqual([]);
  });
});
