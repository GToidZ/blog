# GToidZ's Blog Website Project

## Overview
This is blog framework project that holds 3 different things:
1. An Obsidian compatible vault directory `/vault` containing two main directories:
   - `/vault/posts`: contain markdown files that are used as blog posts (filename should be templated as `datetime-title-slug.md` e.g. `2026-09-01_20-30_hello-world.md`)
   - `/vault/terminology`: contain markdown files that can be backlinked by blog posts and shown as a modal popup on the site when clicked/tapped
   Any other directories such as `.obsidian` is ignored by the site generator.
2. A markdown parser with extensions to allow for custom syntax in blog posts.
3. A site generator that aggregates the Obsidian vault -> passes each relevant markdown files to parser -> takes from parser and lay them out as static site. The site generator is built for deploying on GitHub Actions (if too limited, consider Railway, Render or Vercel but try to prioritize free service)

## Project Structure
- `/vault` - Obsidian-compatible vault
  - `/vault/posts` - Markdown files that are used as blog posts
    - File name of each markdown document starts with `YYYY-MM-DD_HH-mm_` in 24-hour format, then ends with a string slug of any name.
    - Each file should include a frontmatter block that also include metadata,
      ```yaml
      ---
      written-on: 2026-09-01 20:30 UTC+7:00
      title: Hello, world!
      tags: [greeting]
      ---
      ```
    - Metadata is read by the site generator, if not present defaults to:
      - Written date take from the filename, timezone is marked as UTC.
      - Title take from filename, replace `-` with space, and titlecase the title.
      - Tags stay empty.
  - `/vault/terminology` - Markdown files that can be linked back from the posts in order to show terminology as modal on a site
    - File name is free-form but must be unique.
    - Site generator looks for backlinks e.g. `[[foo]]` to refer files in terminology directory.
    - If a backlink goes out of this directory, do not turn it into clickable rich-text.
- `/src` - Source code for other components
- `/src/parser` - A project for Markdown parser that allows new extensions to be created
  - `/src/parser/core` - A markdown parser (can be a wrapper to popular modules)
  - `/src/parser/extension` - A directory containing extensions
    - `/src/parser/extension/<extension-name>/Specfile` - Each extension must have specification file so agents can refer to how author expects what goes in and what comes out. **IMPORTANT:** To understand Specfile, refer to the `parser-spec-sync` skill.
  - `/src/parser/test` - Test suite for Markdown parsing, make sure to give importance to edge cases for extensions.
- `/src/generator` - A project for site generator
  - `/src/generator/test` - Run tests with dummy vault, and validate frontmatter, Obsidian backlinks.

## Component Requirements

### Vault
- Must be an Obsidian vault
- Install templating extension/add-on to handle post creation
  - Format filename
  - Add frontmatter

### Parser
- Use Bun as runtime
- Use TypeScript and make sure to make strict
- Always refer to `parser-spec-sync` skill when working with custom extensions

### Site Generator
- Use Bun as runtime
- Use TypeScript and make sure to make strict
- Build for GitHub Actions first unless too limited
- If state management is required, use Zustand
  
## Site Map
- Homepage (`/`): contain paginated blog entries, show title, written date time **as reader's local time** and tags that are linked to `/tag/<tag>`
- Tag (`/tag/<tag>`): contain list of blog entries with respective tag, has a divider between tag name and blog entries
- Tags (`/tags`): contain list of all available tags
- Entry (`/entry/<filename>`): show blog entry of the filename from the Vault

## Design Guidelines
All pages have a header that shows three links, "Home", "Latest" (links to latest post, update by rebuilding site), and "Tags"; the links are aligned to the left of page, while a button to switch color theme is aligned to the right of page. The switch color theme button also is sticky to the view (so, users can change color whenever)

Font: Make sure to have fonts available for 3 languages, English, Thai and Japanese.
- English: Rubik for headings and IBM Plex Sans for content
- Thai: Kanit for both heading (bold) and content
- Japanese: LINE Seed JP for both heading (bold) and content

Color: Use Catppuccin color scheme, color switch plays an animation of circle cutout originating from button.

Padding: Modern, make use of negative space from the screen bounds.

Buttons: Circular, use icons instead of text if possible.

Responsiveness: When width is nearly equal to phone screens, change header links from left-to-right into top-to-bottom, color change button stays on top-right of view.

Animation: Modal popup has an animation of floating up, hovering on a backlink should raise the link text a little (add drop shadow for pizzazz).

Code Blocks: Syntax highlighting based on language, make it so the code block has the same width as content width limit, have scrollable box. For this, don't implement from scratch, find existing solutions.

<!-- From here on, agents should jot their note for multi-session work -->
## Agent Notes / Progress
- `src/parser`: core done — markdown-it wrapper, `parseMarkdown()` in `src/parser/core/index.ts`, tests + typecheck pass (`bun run test` / `bun run typecheck` in `src/parser`). `html: false` (raw HTML escaped, XSS-safe default). Code fence highlighting via highlight.js (`hljs` classes; Catppuccin CSS lives in generator).
- `extension/callout-note` Specfile status is `draft` → NOT implemented per parser-spec-sync. Needs author approval before implementing.
- `extension/image-annotation` Specfile status `implemented` — whole-line `![alt](src)` followed directly by `^(x, y): text` lines → `<figure class="img-annotated">` + positioned `.img-note` spans (tooltip/raise styled in generator CSS). Raw `<img>` carriers deliberately unsupported (XSS-safe); details in Specfile. Coords are px of natural image size; `main.js` converts to % of `naturalWidth/Height` once loaded → notes track image bounds at any width; bubbles 22px desktop / 28px touch, center-anchored, tooltip on hover/focus (tabindex), tooltip is a real `.img-tip` element positioned by `main.js` within screen bounds (clamp to side margins, flip below near viewport top; above-center CSS default = no-JS fallback).
- `src/generator`: done — `bun run generate` builds `dist/` from `vault/` (index paginated 10/page, `/entry/<name>/`, `/tag/<tag>/`, `/tags/`). Pure logic in `lib.ts` (frontmatter hand-rolled for 3 keys — swap to YAML lib if specs grow). Backlinks: in-terminology → `<button class="term">` + native `<dialog>` popup; outside → left as literal `[[name]]`. Post sort by filename date (written-on tz not parsed). Fonts: all 4 via single Google Fonts `<link>` (LINE Seed JP confirmed on Google Fonts v5). Theme: Catppuccin Latte/Mocha, `prefers-color-scheme` + localStorage toggle.
  - Bun caveat: Bun cannot follow symlinked workspace deps on WSL DrvFs (`/mnt/f`) — so generator imports parser via relative path `../parser/core`, not `@dossari/parser`. Workspace dep still valid on ext4/CI if wanted back.
  - Stub vault for tests/CI lives at `src/generator/test/fixture/vault` (2 posts, 1 term) — used by `build.test.ts` and workflow smoke-build step; real `vault/` is author-owned, keep it empty of dummy content.
  - Entry URLs are `/entry/<filename-without-.md>/` (directory + index.html, GH Pages friendly).
  - Reader-local time: `parseWrittenOn()` (lib.ts) parses `written-on` tz (incl. `UTC-5:30` form, no-tz → UTC, unparseable → filename-as-UTC) into `<time datetime="ISO">`; `main.js` converts via `toLocaleString`. Applies site-wide (spec requires it on homepage).
  - Theme switch animates as circle cutout from button via View Transitions API (progressive enhancement — instant switch where unsupported). Modal float-up + backlink hover raise/drop-shadow are pure CSS. Buttons are circular icon-only (`.icon-btn` shared by theme toggle + modal close); modal shows term name + X close button.
  - Fixture posts cover: frontmatter+backlinks, no-frontmatter defaults, images (remote picsum URLs — no vault-asset pipeline exists yet), long lorem + Thai/Japanese font sections, negative half-hour tz.
  - Code blocks: markdown-it `highlight` option + highlight.js (build-time, no client JS); Catppuccin Latte/Mocha themes from `@catppuccin/highlightjs`, scoped per `[data-theme]` into `assets/hljs.css`.
  - Vault layout done: `.obsidian/` with Templater plugin v2.25.0 (downloaded from GitHub releases, not committed via npm), `templates/tpl-post.md` + `tpl-terminology.md`, folder templates auto-apply on note creation in `posts/`/`terminology/` (Templater `trigger_on_file_creation` on). Filename convention stays manual (author renames note to `YYYY-MM-DD_HH-mm_slug`). User must approve community plugins on first Obsidian launch. `posts/attachments` set as attachment folder.
  - `.github/workflows/deploy.yml`: push to main → bun test + typecheck + generate → GitHub Pages.