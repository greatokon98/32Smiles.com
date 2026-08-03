export type ContentFormat = "html" | "markdown" | "plain"

const STRONG_HTML_TAGS =
  /<(p|div|section|article|h[1-6]|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|blockquote|pre|figure|img|br|hr|span|strong|em|b|i|u|a|header|footer|main|form)(\s[^<>]*)?(\/?>|>)/i

const MARKDOWN_PATTERNS: RegExp[] = [
  /(^|\n)\s{0,3}#{1,6}\s+\S/m,
  /(\*\*|__)[^\n]*\1/,
  /(\*|_)[^\n]*\1(?![\w])/,
  /\[[^\]]+\]\([^)]+\)/,
  /(^|\n)\s{0,3}([-*+]|\d+[.)])\s+/m,
  /`[^`\n]+`/,
  /(^|\n)\s{0,3}>\s?/m,
  /(^|\n)\s{0,3}(---|___|\*\*\*)\s*$/m,
  /(^|\n)\s{0,3}\|.+\|/m,
  /(^|\n)\s{0,3}```/m,
]

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function detectContentFormat(input: string): ContentFormat {
  const text = (input || "").trim()
  if (!text) return "plain"
  if (STRONG_HTML_TAGS.test(text)) return "html"
  if (MARKDOWN_PATTERNS.some((pattern) => pattern.test(text))) return "markdown"
  return "plain"
}

export function plainTextToHtml(input: string): string {
  const paragraphs = (input || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph.replace(/\n/g, "<br />"))}</p>`)
  return paragraphs.join("\n")
}
