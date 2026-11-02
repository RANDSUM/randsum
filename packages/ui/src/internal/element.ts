// The base every element shares: the one stylesheet, a RollerState it renders
// from, and the DOM events it announces. Not a public entry.
import { LitElement } from 'lit'
import type { CSSResultGroup, PropertyDeclarations, PropertyValues } from 'lit'
import type { RollResult } from '../check'
import type { RollerEvent, RollerState } from '../roller-state'
import { sheet } from './styles'

export type RandsumChangeEvent = CustomEvent<{ readonly notation: string }>
export type RandsumRollEvent = CustomEvent<RollResult>

/** Registers a tag once, and not at all where there is no DOM (server rendering). */
export function define(tag: string, element: CustomElementConstructor): void {
  if (typeof customElements === 'undefined' || customElements.get(tag) !== undefined) return
  customElements.define(tag, element)
}

/** Fires randsum-change and randsum-roll from `host` for a state's user events. */
export function announce(host: HTMLElement, event: RollerEvent): void {
  if (event.type === 'change') {
    host.dispatchEvent(
      new CustomEvent('randsum-change', {
        detail: { notation: event.notation },
        bubbles: true,
        composed: true
      })
    )
  } else if (event.type === 'roll') {
    host.dispatchEvent(
      new CustomEvent('randsum-roll', { detail: event.result, bubbles: true, composed: true })
    )
  }
}

/**
 * A server-rendered element arrives with a declarative shadow root already
 * painted. The first client render replaces it in place, so the page shows
 * the roller from the first frame and swaps to the live one with no flash.
 */
export function freshShadowRoot(host: HTMLElement): void {
  host.shadowRoot?.replaceChildren()
}

/**
 * The roller state a `<randsum-scope>` holds, once it is defined. Checked by
 * shape, not instanceof, so a part never bundles the state (and the roller
 * engine) it is handed.
 */
function stateOf(element: Element | null): RollerState | undefined {
  if (element === null || !('state' in element)) return undefined
  const { state } = element
  return isRollerState(state) ? state : undefined
}

function isRollerState(value: unknown): value is RollerState {
  return typeof value === 'object' && value !== null && 'subscribe' in value && 'notation' in value
}

/**
 * A part: renders from the `roller` property, or else from the nearest
 * `<randsum-scope>` around it, and re-renders on every change.
 */
export class PartElement extends LitElement {
  static override styles: CSSResultGroup = sheet
  static override properties: PropertyDeclarations = { roller: { attribute: false } }

  /** The state to render from. Leave it unset inside a `<randsum-scope>`. */
  declare roller: RollerState | undefined

  #scoped: RollerState | undefined
  #bound: RollerState | undefined
  #off: (() => void) | undefined

  /** The state this part renders from, once it has one. */
  get state(): RollerState | undefined {
    return this.roller ?? this.#scoped
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    freshShadowRoot(this)
    return super.createRenderRoot()
  }

  override connectedCallback(): void {
    super.connectedCallback()
    const scope = this.closest('randsum-scope')
    this.#scoped = stateOf(scope)
    if (scope !== null && this.#scoped === undefined) {
      void customElements.whenDefined('randsum-scope').then(() => {
        this.#scoped = stateOf(scope)
        this.#sync()
        this.requestUpdate()
      })
    }
    this.#sync()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#off?.()
    this.#off = undefined
    this.#bound = undefined
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    this.#sync()
  }

  #sync(): void {
    const state = this.state
    if (state === this.#bound) return
    this.#off?.()
    this.#bound = state
    this.#off = state?.subscribe(() => {
      this.requestUpdate()
    })
  }
}
