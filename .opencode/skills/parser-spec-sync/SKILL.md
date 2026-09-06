---
name: parser-spec-sync
description: Use this skill whenever adding, changing, or implementing custom markdown syntax for the blog — triggers on edits to markdown-extension-spec.template.md, work inside /src/parser, or a request like "add support for X markdown syntax."
---

# Markdown Spec Sync
This skill explains how to turn entries in `Specfile`
into working code. Read the spec file first, then follow the steps below.
 
## What each field in the spec means
- **Trigger syntax** — the literal text pattern to detect. Becomes the
  matching rule in the extension (a regular expression, or a check against the
  parsed document tree — whichever fits the pattern).
- **Description** — context only. Implement exactly what the example shows,
  even if the description sounds minor.
- **Input example** — use verbatim as a test input under `test` directory.
- **Expected output** — the test's expected result. Fail the test on any
  difference, including whitespace, unless the entry says otherwise.
- **Edge cases / notes** — extra test cases. E.g. "skip rendering if empty"
  means write a second test for the empty case.
- **Status** — controls whether to act:
  - `draft` → do not implement yet.
  - `approved` → safe to implement.
  - `implemented` → already done; check if edits need matching test updates.
  - `deprecated` → do not implement or delete code; old posts may use it.

## Workflow: adding new syntax
1. Confirm Status is `approved`.
2. Write a test in `test` using the Input/Output examples, before writing any extension code.
3. Write the extension in respective `/src/parser/extension/**` to pass that test.
4. Run the full test suite, not just the new test — a matching rule that's too broad can silently break existing syntax.
5. Update the entry's Status to `implemented`.
6. Do not touch `/content` (actual blog posts) as part of this work.

## Workflow: changing existing syntax
1. Find the entry and its existing tests.
2. Update the spec's Input/Output examples first.
3. Update the test to match.
4. Update the extension until the test passes.
5. Search `/vault/posts` for posts using the old syntax and flag them — don't
   auto-edit blog content without being asked.

## If the spec is ambiguous
Stop and ask rather than guessing. A wrong guess here produces an extension that
silently mangles blog posts — harder to catch than a missing feature.