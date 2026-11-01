// Server rendering: turns markup that uses the elements into HTML with each
// element's shadow root already filled in (Declarative Shadow DOM), so the
// roller shows from the first frame, before any script runs. In the browser,
// import the elements as usual; each replaces its server-rendered copy with
// the live one on upgrade.
//
//   import { renderToString } from '@randsum/ui/ssr'
//   const html = await renderToString('<randsum-roller size="mini" notation="4d6L"></randsum-roller>')
//
// Runs in Node, Bun, Deno and edge runtimes. Needs @lit-labs/ssr installed.
import { render } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { unsafeStatic, html as staticHtml } from 'lit/static-html.js'
import './roller'
import './scope'
import './notation-field'
import './roll-button'
import './status-line'
import './key-pad'
import './preset-list'
import './readout'
import './roll-steps'

/**
 * Renders HTML that contains `<randsum-*>` tags. Attributes carry the
 * properties (`presets` and `keys` as JSON). Resolves to the HTML string.
 */
export async function renderToString(markup: string): Promise<string> {
  return collectResult(render(staticHtml`${unsafeStatic(markup)}`))
}
