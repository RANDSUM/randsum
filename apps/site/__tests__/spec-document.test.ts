import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONFORMANCE_FILE } from '../../../packages/roller/spec/vectors'
import { LEVELS, badgeSvg, themeColour } from '../src/spec/badges'
import { sectionGroups, splitSectionNumber, withAppendixH } from '../src/spec/sections'
import { specHtml } from '../src/spec/specHtml'

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const theme = fs.readFileSync(path.join(siteDir, 'src/styles/theme.css'), 'utf-8')
const spec = fs.readFileSync(path.join(siteDir, 'src/content/specs/v0.9.0.md'), 'utf-8')

describe('section numbers', () => {
  test.each([
    ['6.4.2 Cap', '6.4.2', 'Cap'],
    ['1. Introduction', '1.', 'Introduction'],
    ['G.14 Conformance Level Cross-Index', 'G.14', 'Conformance Level Cross-Index'],
    ['Appendix A: Priority Table', 'Appendix A', 'Priority Table'],
    ['Abstract', undefined, 'Abstract']
  ])('%s', (text, number, title) => {
    expect(splitSectionNumber(text)).toEqual({ number, title })
  })

  test('navigation groups front matter, sections, then appendices and back matter', () => {
    const headings = withAppendixH(
      [
        'Abstract',
        '1. Introduction',
        '13. References',
        'Appendix G: Vectors',
        "Authors' Addresses"
      ].map((text, i) => ({ depth: 2, slug: `s${i}`, text }))
    )
    expect(sectionGroups(headings).map(g => [g.label, g.items.map(h => h.text)])).toEqual([
      ['Front matter', ['Abstract']],
      ['Sections', ['1. Introduction', '13. References']],
      [
        'Appendices',
        [
          'Appendix G: Vectors',
          'Appendix H: Notation Quick Reference (Informative)',
          "Authors' Addresses"
        ]
      ]
    ])
  })
})

describe('formal markup', () => {
  test('sets the section number apart', () => {
    expect(specHtml('<h3 id="642-cap">6.4.2 Cap</h3>')).toBe(
      '<h3 id="642-cap"><span class="secno">6.4.2</span> Cap</h3>'
    )
  })

  test('marks BCP 14 keywords in prose, and not in code, links or headings', () => {
    const html = specHtml(
      '<h4 id="x">4.1 MUST</h4><p>It MUST NOT and MAY. <code>MUST</code> <a href="#">MAY</a></p>'
    )
    expect(html).toContain('<em class="rfc2119">MUST NOT</em> and <em class="rfc2119">MAY</em>')
    expect(html).toContain('<code>MUST</code> <a href="#">MAY</a>')
    expect(html).toContain('4.1</span> MUST</h4>')
  })

  test('labels informative sections and boxes notes', () => {
    const html = specHtml(
      '<h2 id="7">7. Groups (Informative)</h2><blockquote><p><strong>Note:</strong> x</p></blockquote>'
    )
    expect(html).toContain('</h2><p class="informative">This section is non-normative.</p>')
    expect(html).toContain('<blockquote class="note">')
  })
})

// Appendix G.14 is prose in the spec; the levels are derived from the vectors.
// They must name the same ids, or an implementer passes the wrong set.
describe('Appendix G.14 matches the vectors', () => {
  const ranges = (ids: readonly number[]): string =>
    ids
      .reduce<number[][]>((acc, id) => {
        const last = acc.at(-1)
        if (last && last.at(-1) === id - 1) last.push(id)
        else acc.push([id])
        return acc
      }, [])
      .map(run => (run.length === 1 ? `${run[0]}` : `${run[0]}-${run.at(-1)}`))
      .join(', ')
  const added = (ids: readonly number[], below: readonly number[]): number[] =>
    ids.filter(id => !below.includes(id))
  const { level1_core, level2_vtt, level3_extended, level4_full, errorCases } =
    CONFORMANCE_FILE.conformanceLevels

  test.each([
    ['Level 1 (Core)', ranges(level1_core)],
    ['Level 2 (VTT Baseline)', `All Level 1 + ${ranges(added(level2_vtt, level1_core))}`],
    ['Level 3 (Extended)', `All Level 2 + ${ranges(added(level3_extended, level2_vtt))}`],
    ['Level 4 (Full)', `All Level 3 + ${ranges(added(level4_full, level3_extended))}`],
    ['Error Cases', `${ranges(errorCases)} (required at every level)`]
  ])('%s', (level, vectors) => {
    const row = spec.split('\n').find(line => line.startsWith(`| ${level} `))
    expect(row?.split('|')[2]?.trim()).toBe(vectors)
  })

  test('the spec counts the vectors the file has', () => {
    expect(spec).toContain(`all ${CONFORMANCE_FILE.vectors.length} test vectors`)
  })
})

describe('conformance badges', () => {
  test('colours come from the theme', () => {
    expect(themeColour(theme, '--product-spec')).toMatch(/^#[0-9a-f]{6}$/)
    expect(themeColour(theme, '--rs-paper')).toBe('#fff')
  })

  test.each([...LEVELS])('level $level is a labelled SVG naming its version and level', level => {
    const svg = badgeSvg('0.9.0', level, { label: '#333', message: '#16b', text: '#fff' })
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg).toContain(`aria-label="RDN 0.9.0 Level ${level.level} (${level.name}) conformant"`)
    expect(svg).toContain(`>Level ${level.level} · ${level.name}</text>`)
    expect(svg).not.toContain('undefined')
  })
})
