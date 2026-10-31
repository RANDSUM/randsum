import type { CollectionEntry } from 'astro:content'

type SpecEntry = CollectionEntry<'specs'>

/** "0.9.0 (revision 2)", or "0.9.0" before any revision. */
export function versionLabel(entry: SpecEntry): string {
  const { version, revision } = entry.data
  return revision === undefined ? version : `${version} (revision ${revision})`
}

/** "31 October 2026", the way W3C and IETF documents date themselves. */
export function longDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

/**
 * The spec as one Markdown document: the header the page renders from the
 * front matter, then the body. Copy Markdown, Open in Claude and
 * /spec/llms-full.txt share it, so the text people paste names its version.
 */
export function specMarkdown(entry: SpecEntry): string {
  const { title, status, date, editor } = entry.data
  return [
    `# ${title}`,
    '',
    `**Version:** ${versionLabel(entry)}  `,
    `**Status:** ${status}  `,
    `**Date:** ${date}  `,
    `**Editor:** ${editor}`,
    '',
    entry.body ?? ''
  ].join('\n')
}
