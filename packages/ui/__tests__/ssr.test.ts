import { describe, expect, test } from 'bun:test'
import '../src/roller'
import { renderToString } from '../src/ssr'

describe('server rendering', () => {
  test('fills each element’s shadow root with declarative Shadow DOM', async () => {
    const out = await renderToString(
      `<randsum-roller size="mini" notation="4d6L" presets='[{"label":"Adv","notation":"2d20H"}]'></randsum-roller>`
    )
    expect(out).toContain('shadowrootmode="open"')
    expect(out).toContain('class="rsui rsui-mini"')
    expect(out).toContain('value="4d6L"')
    expect(out).toContain('Roll 4 6-sided dice, Drop lowest')
  })

  test('renders parts inside a scope from the scope’s notation', async () => {
    const out = await renderToString(
      '<randsum-roller size="compact" notation="2d6+1"></randsum-roller>'
    )
    expect(out).toContain('rsui-compact')
    expect(out).toContain('value="2d6+1"')
  })
})

describe('upgrading a server-rendered element', () => {
  test('replaces the declarative shadow root instead of appending to it', async () => {
    const el = document.createElement('randsum-roller')
    const stale = el.attachShadow({ mode: 'open' })
    stale.innerHTML = '<div class="server-copy">server</div>'
    el.setAttribute('notation', '1d6')
    document.body.append(el)
    await el.updateComplete
    expect(el.shadowRoot?.querySelector('.server-copy')).toBeNull()
    expect(el.shadowRoot?.querySelectorAll('.rsui-compact')).toHaveLength(1)
  })
})
