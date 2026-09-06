export interface PostMeta {
  /** Full md filename, e.g. "2026-09-01_20-30_hello-world.md" */
  filename: string;
  /** Entry URL segment: filename without extension */
  name: string;
  /** Display date, e.g. "2026-09-01 20:30 UTC+7:00" */
  date: string;
  /** ISO 8601 datetime with offset, for <time datetime> / reader-local rendering */
  datetime: string;
  /** Sort key, e.g. "2026-09-01_20-30" (from filename, UTC) */
  sortKey: string;
  title: string;
  tags: string[];
  /** Raw markdown body (frontmatter stripped) */
  body: string;
}

const FILENAME_RE = /^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})_(.+)\.md$/;

/**
 * URL prefix for all site-rooted paths (e.g. "/blog" on project Pages).
 * BASE_PATH env wins; else auto-derived from GITHUB_REPOSITORY (CI); else "" (site at domain root).
 */
export const base = (
  process.env.BASE_PATH ??
  (process.env.GITHUB_REPOSITORY?.includes("/")
    ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}`
    : "")
).replace(/\/+$/, "");

export function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Returns null for files that don't match the post filename convention. */
export function parseFilename(filename: string): { date: string; sortKey: string; name: string; title: string } | null {
  const m = FILENAME_RE.exec(filename);
  if (!m) return null;
  const [, d, hm, slug] = m as unknown as [string, string, string, string];
  return {
    date: `${d} ${hm.replace("-", ":")}`,
    sortKey: `${d}_${hm}`,
    name: filename.replace(/\.md$/, ""),
    title: titleFromSlug(slug),
  };
}

/** ponytail: hand-rolled parser for our 3-key frontmatter only; pull in a YAML lib if specs grow lists/nesting. */
export function parseFrontmatter(source: string): { meta: Record<string, string | string[]>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!m) return { meta: {}, body: source };
  const meta: Record<string, string | string[]> = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    const arr = /^\[(.*)\]$/.exec(value);
    meta[key] = arr
      ? arr[1]!.split(",").map((s) => s.trim()).filter(Boolean)
      : value;
  }
  return { meta, body: m[2]! };
}

/**
 * Parse "2026-09-01 20:30 UTC+7:00" (also accepts "+07:00", "Z", or no tz → UTC)
 * into ISO 8601 with offset. Returns null if unparseable.
 */
export function parseWrittenOn(value: string): string | null {
  const m =
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?\s*(?:(?:UTC)?([+-])(\d{1,2}):?(\d{2})?|Z)?$/.exec(
      value.trim()
    );
  if (!m) return null;
  const [, d, hh, mm, ss, sign, offH, offM] = m as unknown as (string | undefined)[];
  let offset = "Z";
  if (sign) {
    const h = Number(offH!).toString().padStart(2, "0");
    const min = (offM ?? "00").padStart(2, "0");
    offset = `${sign}${h}:${min}`;
  }
  return `${d}T${hh}:${mm}:${ss ?? "00"}${offset}`;
}

/** Build a PostMeta from file content; frontmatter falls back to filename-derived defaults. */
export function makePost(filename: string, source: string): PostMeta | null {
  const parsed = parseFilename(filename);
  if (!parsed) return null;
  const { meta, body } = parseFrontmatter(source);
  const writtenOn = meta["written-on"];
  const written =
    typeof writtenOn === "string" && writtenOn ? parseWrittenOn(writtenOn) : null;
  return {
    filename,
    name: parsed.name,
    date: typeof writtenOn === "string" && writtenOn ? writtenOn : `${parsed.date} UTC`,
    // ponytail: unparseable written-on falls back to filename as UTC; tz handling is ISO-offset only
    datetime: written ?? `${parsed.date.replace(" ", "T")}:00Z`,
    sortKey: parsed.sortKey,
    title: typeof meta["title"] === "string" && meta["title"] ? meta["title"] : parsed.title,
    tags: Array.isArray(meta["tags"]) ? meta["tags"] : [],
    body,
  };
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function tagSlug(tag: string): string {
  return encodeURIComponent(tag);
}

/**
 * Replace [[name]] with a clickable term button when `terms` has it;
 * otherwise leave the literal text (backlinks out of terminology dir stay plain).
 */
export function renderBacklinks(html: string, terms: Set<string>): { html: string; used: string[] } {
  const used: string[] = [];
  const out = html.replace(/\[\[([^\][#|]+)\]\]/g, (whole, rawName: string) => {
    const name = rawName.trim();
    if (!terms.has(name)) return whole;
    if (!used.includes(name)) used.push(name);
    return `<button class="term" data-term="${esc(tagSlug(name))}">${esc(name)}</button>`;
  });
  return { html: out, used };
}
