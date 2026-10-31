// How the spec numbers its sections. Shared by the rehype plugin that sets the
// numbers apart in the document and the navigation built from its headings.

export interface Heading {
  depth: number
  slug: string
  text: string
}

// "6.4.2 Cap", "1. Introduction", "G.13 Cross-Index", "Appendix A: Priority Table"
export const SECTION_NUMBER: RegExp =
  /^((?:Appendix [A-Z]:?)|(?:[A-Z](?:\.\d+)+)|(?:\d+(?:\.\d+)*\.?))\s+/

/** A heading's number ("6.4.2", "Appendix A") and the title after it. */
export function splitSectionNumber(text: string): { number: string | undefined; title: string } {
  const match = SECTION_NUMBER.exec(text)
  if (!match?.[1]) return { number: undefined, title: text }
  return { number: match[1].replace(/:$/, ''), title: text.slice(match[0].length) }
}

interface HeadingGroup {
  label: string
  items: Heading[]
}

/**
 * The top-level headings in the three runs a formal spec has: the unnumbered
 * front matter (Abstract, Status), the numbered sections, and the appendices.
 */
export function sectionGroups(headings: readonly Heading[]): HeadingGroup[] {
  const top = headings.filter(h => h.depth === 2)
  const firstNumbered = top.findIndex(h => splitSectionNumber(h.text).number !== undefined)
  const front = firstNumbered === -1 ? top : top.slice(0, firstNumbered)
  const rest = top.slice(front.length)
  const groups: HeadingGroup[] = [
    { label: 'Front matter', items: front },
    { label: 'Sections', items: rest.filter(h => /^\d/.test(h.text)) },
    // The appendices, then the back matter (Authors' Addresses)
    { label: 'Appendices', items: rest.filter(h => !/^\d/.test(h.text)) }
  ]
  return groups.filter(g => g.items.length > 0)
}

/** The number as navigation shows it: an appendix by its letter alone. */
export function navNumber(number: string): string {
  return number.replace(/^Appendix /, '')
}

/**
 * Appendix H is rendered from the roller's docs after the Markdown, so its
 * heading is added by hand, after Appendix G and before the back matter.
 */
export function withAppendixH(headings: readonly Heading[]): Heading[] {
  const appendixH: Heading = {
    depth: 2,
    slug: 'appendix-h',
    text: 'Appendix H: Notation Quick Reference (Informative)'
  }
  const back = headings.findIndex(h => h.depth === 2 && h.text.startsWith('Authors'))
  return back === -1
    ? [...headings, appendixH]
    : [...headings.slice(0, back), appendixH, ...headings.slice(back)]
}
