import type MarkdownIt from "markdown-it";

/** Whole-line markdown image: ![alt](src) or ![alt](src "title") */
const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
/** ^(x, y): text — pixel coords from image left/top */
const ANNOTATION_RE = /^\^\((\d+),\s*(\d+)\):\s*(.*)$/;

interface Note {
  x: string;
  y: string;
  text: string;
}

/** Block rule: image line followed directly by annotation lines → positioned-note figure. */
function imageAnnotationBlock(state: any, startLine: number, endLine: number, silent: boolean): boolean {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const img = IMAGE_LINE_RE.exec(state.src.slice(startPos, state.eMarks[startLine]));
  if (!img) return false;

  const notes: Note[] = [];
  let line = startLine + 1;
  while (line < endLine) {
    const pos = state.bMarks[line] + state.tShift[line];
    const m = ANNOTATION_RE.exec(state.src.slice(pos, state.eMarks[line]));
    if (!m) break;
    notes.push({ x: m[1]!, y: m[2]!, text: m[3] ?? "" });
    line++;
  }

  if (silent) return true;

  const esc = state.md.utils.escapeHtml;
  const [, alt, src, title] = img as unknown as (string | undefined)[];
  const altAttr = esc(alt ?? "");
  const titleAttr = title ? ` title="${esc(title)}"` : "";
  const notesHtml = notes
    .map((n) => {
      const text = esc(n.text);
      return `<span class="img-note" tabindex="0" style="left:${n.x}px;top:${n.y}px" aria-label="${text}"><span class="img-tip">${text}</span></span>`;
    })
    .join("");

  const token = state.push("html_block", "", 0);
  token.content = `<figure class="img-annotated"><img src="${esc(src ?? "")}" alt="${altAttr}"${titleAttr}>${notesHtml}</figure>`;
  token.map = [startLine, line];
  state.line = line;
  return true;
}

/** ponytail: whole-line images only, and raw <img> tag lines are not annotation carriers (html:false keeps source-driven attrs escaped) */
export function applyImageAnnotation(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "image_annotation", imageAnnotationBlock);
}
