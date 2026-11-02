// Conformance badges (spec §10.7): flat, shields.io-style SVGs that an
// implementation puts beside its claim. A badge is a standalone file shown in
// READMEs, where no stylesheet reaches, so its colours are read out of
// theme.css at build time rather than written here.
import { PIPS } from '../utils/product'
import { LEVELS } from '@randsum/notation-spec'

// The level names are the notation-spec package's (spec Section 10).
export { LEVELS }

export type Level = (typeof LEVELS)[number]

/** A theme token's value: its light arm when it is `light-dark(light, dark)`. */
export function themeColour(theme: string, token: string): string {
  const value = new RegExp(`${token}:\\s*([^;]+);`).exec(theme)?.[1]?.trim()
  if (value === undefined) throw new Error(`theme.css has no ${token}`)
  const light = /^light-dark\(\s*([^,]+),/.exec(value)?.[1]
  return (light ?? value).trim()
}

// Verdana at 11px, the face and size shields.io sets badges in. Close enough
// to size the boxes; textLength pins the drawn text to the same width.
const WIDTHS: Record<string, number> = {
  ' ': 3.9,
  '.': 3.9,
  '·': 3.9,
  ':': 4.6,
  '-': 4.6,
  '(': 4.5,
  ')': 4.5,
  A: 7.5,
  B: 7.5,
  C: 7.7,
  D: 8.4,
  E: 7.0,
  F: 6.3,
  G: 8.5,
  H: 8.3,
  I: 4.6,
  J: 5.0,
  K: 7.6,
  L: 6.1,
  M: 9.3,
  N: 8.2,
  O: 8.6,
  P: 6.6,
  Q: 8.6,
  R: 7.6,
  S: 7.5,
  T: 6.8,
  U: 8.1,
  V: 7.5,
  W: 10.9,
  X: 7.5,
  Y: 6.8,
  Z: 7.5,
  a: 6.7,
  b: 6.9,
  c: 5.8,
  d: 6.9,
  e: 6.6,
  f: 3.9,
  g: 6.9,
  h: 7.0,
  i: 3.0,
  j: 3.8,
  k: 6.5,
  l: 3.0,
  m: 10.7,
  n: 7.0,
  o: 6.7,
  p: 6.9,
  q: 6.9,
  r: 4.7,
  s: 5.7,
  t: 4.3,
  u: 7.0,
  v: 6.5,
  w: 9.0,
  x: 6.5,
  y: 6.5,
  z: 5.8
}
const textWidth = (text: string): number =>
  [...text].reduce((sum, ch) => sum + (WIDTHS[ch] ?? 7.0), 0)

const escapeXml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

interface BadgeColours {
  label: string
  message: string
  text: string
}

/** The spec's pip die (the Symbols pattern) as a 14px knockout logo at x, y. */
function logo(x: number, y: number, colour: string): string {
  const body =
    'M26 0H74A26 26 0 0 1 100 26V74A26 26 0 0 1 74 100H26A26 26 0 0 1 0 74V26A26 26 0 0 1 26 0Z'
  const holes = PIPS.spec.map(([cx, cy]) => `M${cx - 8} ${cy}a8 8 0 1 0 16 0a8 8 0 1 0-16 0Z`)
  return `<path transform="translate(${x} ${y}) scale(0.14)" fill="${colour}" fill-rule="evenodd" d="${body}${holes.join('')}"/>`
}

export function badgeSvg(version: string, level: Level, colours: BadgeColours): string {
  const label = `RDN ${version}`
  const message = `Level ${level.level} · ${level.name}`
  const logoSpace = 19
  const labelText = textWidth(label)
  const messageText = textWidth(message)
  const labelWidth = Math.round(logoSpace + labelText + 10)
  const messageWidth = Math.round(messageText + 10)
  const width = labelWidth + messageWidth
  const title = `RDN ${version} Level ${level.level} (${level.name}) conformant`
  // shields.io's flat style: text drawn at 10x and scaled down for crisp hinting
  const text = (content: string, centre: number, length: number): string =>
    `<text x="${centre * 10}" y="140" transform="scale(.1)" fill="${colours.text}" textLength="${Math.round(length * 10)}">${escapeXml(content)}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<clipPath id="r"><rect width="${width}" height="20" rx="3"/></clipPath>
<g clip-path="url(#r)">
<rect width="${labelWidth}" height="20" fill="${colours.label}"/>
<rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${colours.message}"/>
</g>
${logo(5, 3, colours.text)}
<g font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110" text-anchor="middle" text-rendering="geometricPrecision">
${text(label, logoSpace + labelText / 2 + 5, labelText)}
${text(message, labelWidth + messageWidth / 2, messageText)}
</g>
</svg>
`
}
