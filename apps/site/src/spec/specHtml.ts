// Formal-specification markup for the notation spec's rendered HTML, the way
// W3C and IETF documents set theirs: the section number set apart from each
// heading, BCP 14 keywords marked, informative sections labelled, and notes
// boxed. Astro renders the Markdown with Sätteri, which takes no rehype
// plugins, so this works on the HTML string. The input is our own Markdown's
// output, not arbitrary HTML: a tag never holds a raw `>`.

import { splitSectionNumber } from './sections'

const KEYWORD_LIST =
  'MUST NOT|MUST|REQUIRED|SHALL NOT|SHALL|SHOULD NOT|SHOULD|NOT RECOMMENDED|RECOMMENDED|MAY|OPTIONAL'
const KEYWORDS = new RegExp(`\\b(${KEYWORD_LIST})\\b`, 'g')
// Keywords are prose; inside code, links, headings and Expressive Code's
// copy buttons they are just letters
const NO_KEYWORDS = /^(?:code|pre|a|h[1-6]|button|script|style)$/
const TAG = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/

/** "<h3 id="64-cap">6.4 Cap</h3>" with the number in a span.secno. */
function numberHeadings(html: string): string {
  return html.replace(
    /<(h[2-6])([^>]*)>([^<]+)/g,
    (whole, tag: string, attrs: string, text: string) => {
      const { number, title } = splitSectionNumber(text)
      if (number === undefined) return whole
      return `<${tag}${attrs}><span class="secno">${number}</span> ${title}`
    }
  )
}

/** A W3C-style "This section is non-normative." after each informative heading. */
function labelInformative(html: string): string {
  return html.replace(
    /(<h[2-6][^>]*>(?:(?!<\/h[2-6]>).)*\(Informative\)(?:(?!<\/h[2-6]>).)*<\/h[2-6]>)/g,
    '$1<p class="informative">This section is non-normative.</p>'
  )
}

/** Boxes blockquotes that open with "Note:", and marks tables as data tables. */
function classifyBlocks(html: string): string {
  return html
    .replace(/<blockquote>(\s*<p>\s*<strong>Note:)/g, '<blockquote class="note">$1')
    .replace(/<table>/g, '<table class="data">')
}

/** Wraps BCP 14 keywords in prose text in em.rfc2119. */
function markKeywords(html: string): string {
  const open: string[] = []
  return html
    .split(/(<[^>]+>)/)
    .map(part => {
      const tag = TAG.exec(part)
      if (tag) {
        const [, closing, name = ''] = tag
        const lower = name.toLowerCase()
        if (NO_KEYWORDS.test(lower)) {
          const at = open.lastIndexOf(lower)
          if (closing) {
            if (at !== -1) open.splice(at, 1)
          } else if (!part.endsWith('/>')) open.push(lower)
        }
        return part
      }
      if (open.length > 0 || part === '') return part
      return part.replace(KEYWORDS, '<em class="rfc2119">$1</em>')
    })
    .join('')
}

export function specHtml(html: string): string {
  return markKeywords(classifyBlocks(labelInformative(numberHeadings(html))))
}
