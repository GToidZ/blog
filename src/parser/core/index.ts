import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { applyImageAnnotation } from "../extension/image-annotation";

const md = new MarkdownIt({
  html: false,
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="hljs language-${md.utils.escapeHtml(lang)}">${hljs.highlight(code, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch {
        // fall through to plain escaped output
      }
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(code)}</code></pre>`;
  },
});

// Registered extensions
applyImageAnnotation(md);

export function parseMarkdown(source: string): string {
  return md.render(source);
}
