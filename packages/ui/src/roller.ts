// <randsum-roller>: the whole roller in one element, in three sizes.
//
//   <randsum-roller size="mini" notation="4d6L"></randsum-roller>
//
// size="mini" is the field and Roll, with the keys and the total a row below;
// "compact" (the default) is a panel with the readout beside or above the
// builder; "max" adds recent rolls and a History dialog.
// It fires randsum-change on every edit and randsum-roll after every roll.
import { html, LitElement, nothing } from 'lit'
import type { CSSResultGroup, PropertyDeclarations, PropertyValues, TemplateResult } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import type { RollResult } from './check'
import { EMPTY_HISTORY } from './internal/copy'
import { announce, define, freshShadowRoot } from './internal/element'
import { keyPad } from './internal/parts/key-pad'
import { notationField } from './internal/parts/notation-field'
import { presetList } from './internal/parts/preset-list'
import type { PresetsLayout } from './internal/parts/preset-list'
import { readout } from './internal/parts/readout'
import { rollButton } from './internal/parts/roll-button'
import { statusLine } from './internal/parts/status-line'
import { sheet } from './internal/styles'
import { DEFAULT_KEYS } from './keys'
import type { Key } from './keys'
import type { Preset } from './presets'
import { RollerState } from './roller-state'

export type { RollResult } from './check'
export type { RandsumChangeEvent, RandsumRollEvent } from './internal/element'
export type { PresetsLayout } from './internal/parts/preset-list'
export type { Key } from './keys'
export type { Preset } from './presets'
export type { RollerState } from './roller-state'

export type RollerSize = 'max' | 'compact' | 'mini'

export interface HistoryEntry {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly description: string
}

const RECENT = 3

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry: Record<string, unknown> = { ...value }
  return (
    typeof entry['id'] === 'number' &&
    typeof entry['notation'] === 'string' &&
    typeof entry['total'] === 'number' &&
    typeof entry['description'] === 'string'
  )
}

function loadHistory(storageKey: string | undefined): readonly HistoryEntry[] {
  if (storageKey === undefined) return []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : []
  } catch {
    return []
  }
}

function saveHistory(storageKey: string | undefined, history: readonly HistoryEntry[]): void {
  if (storageKey === undefined) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(history))
  } catch {
    // Private mode or a full quota: history just doesn't persist
  }
}

const trueUnlessFalse = (value: string | null): boolean => value !== 'false'

function dieGlyph(): TemplateResult {
  return html`<svg width="20" height="20" viewBox="0 0 100 100" aria-hidden="true">
    <rect x="8" y="8" width="84" height="84" rx="20" fill="none" stroke="currentColor" stroke-width="8" />
    <circle cx="32" cy="32" r="8" fill="currentColor" />
    <circle cx="50" cy="50" r="8" fill="currentColor" />
    <circle cx="68" cy="68" r="8" fill="currentColor" />
  </svg>`
}

export class RandsumRoller extends LitElement {
  static override styles: CSSResultGroup = sheet
  static override properties: PropertyDeclarations = {
    size: { reflect: true },
    notation: { noAccessor: true },
    keys: { type: Array },
    presets: { type: Array },
    presetsLabel: { attribute: 'presets-label' },
    presetsLayout: { attribute: 'presets-layout' },
    placeholder: {},
    appLink: { attribute: 'app-link' },
    history: { converter: trueUnlessFalse },
    storageKey: { attribute: 'storage-key' },
    historyLimit: { attribute: 'history-limit', type: Number },
    _open: { state: true },
    _tab: { state: true },
    _history: { state: true },
    _footer: { state: true },
    _closed: { state: true }
  }

  /** 'mini', 'compact' (the default) or 'max'. */
  declare size: RollerSize
  /** The keys to show. Defaults to DEFAULT_KEYS from `@randsum/ui/keys`. */
  declare keys: readonly Key[]
  /** Optional named rolls. The keys stay first; presets sit behind a switch. */
  declare presets: readonly Preset[]
  /** What the presets are called on screen. Defaults to "Presets". */
  declare presetsLabel: string
  /** Compact: 'chips' (the default) or 'list', which shows each description. */
  declare presetsLayout: PresetsLayout
  declare placeholder: string | undefined
  /** Mini and Compact: a link to the full roller. */
  declare appLink: string | undefined
  /** Max: recent rolls and a History dialog. Defaults to true. */
  declare history: boolean
  /** Max: the localStorage key that keeps history across visits. */
  declare storageKey: string | undefined
  /** Max: how many rolls history keeps. Defaults to 50. */
  declare historyLimit: number

  declare _open: boolean
  declare _tab: 'keys' | 'presets'
  declare _history: readonly HistoryEntry[]
  declare _footer: boolean
  declare _closed: RollResult | null

  /** The state the roller renders from. */
  readonly state: RollerState = new RollerState()

  constructor() {
    super()
    this.size = 'compact'
    this.keys = DEFAULT_KEYS
    this.presets = []
    this.presetsLabel = 'Presets'
    this.presetsLayout = 'chips'
    this.history = true
    this.historyLimit = 50
    this._open = false
    this._tab = 'keys'
    this._history = []
    this._footer = false
    this._closed = null
    this.state.subscribe(event => {
      if (event.type === 'roll') this.#record(event.result)
      announce(this, event)
      this.requestUpdate()
    })
  }

  /**
   * The notation. Setting it replaces what the user typed, at once, so a
   * roll() straight after rolls the new value.
   */
  get notation(): string {
    return this.state.notation
  }

  set notation(value: string | null | undefined) {
    const old = this.state.notation
    this.state.set(value ?? '')
    this.requestUpdate('notation', old)
  }

  /** Rolls the current notation, if it is valid. */
  roll(): void {
    this.state.roll()
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    freshShadowRoot(this)
    return super.createRenderRoot()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#closeKeys()
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('storageKey')) this._history = loadHistory(this.storageKey)
  }

  protected override render(): unknown {
    switch (this.size) {
      case 'mini':
        return this.#mini()
      case 'max':
        return this.#max()
      default:
        return this.#compact()
    }
  }

  #record(result: RollResult): void {
    if (this.size !== 'max' || !this.history) return
    const entry: HistoryEntry = {
      // Unique even for two rolls in one millisecond
      id: Math.max(Date.now(), (this._history[0]?.id ?? 0) + 1),
      notation: result.notation,
      total: result.total,
      description: result.description
    }
    this._history = [entry, ...this._history].slice(0, this.historyLimit)
    saveHistory(this.storageKey, this._history)
  }

  // Mini's key pad closes on a press outside it or Escape
  readonly #onPointer = (event: PointerEvent): void => {
    const anchor = this.renderRoot.querySelector('.rsui-anchor')
    if (anchor !== null && event.composedPath().includes(anchor)) return
    this.#closeKeys()
  }

  readonly #onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.#closeKeys()
  }

  #openKeys(): void {
    this._open = true
    document.addEventListener('pointerdown', this.#onPointer)
    document.addEventListener('keydown', this.#onKey)
  }

  #closeKeys(): void {
    this._open = false
    document.removeEventListener('pointerdown', this.#onPointer)
    document.removeEventListener('keydown', this.#onKey)
  }

  // Mini and compact show the last roll over the page until it is closed or
  // the notation changes, so a roll never moves or resizes anything
  #card(className: string): TemplateResult | typeof nothing {
    const { result, notation } = this.state
    if (result === null || result === this._closed || result.notation !== notation) return nothing
    const actions = html`<span class="rsui-card-actions">
      <button type="button" class="rsui-quiet-button" @click=${() => this.state.choose(result)}>
        Roll again
      </button>
      <button
        type="button"
        class="rsui-quiet-button"
        aria-label="Close result"
        @click=${() => {
          this._closed = result
        }}
      >
        Close
      </button>
    </span>`
    return html`<div class=${className}>${readout(this.state, actions)}</div>`
  }

  #mini(): TemplateResult {
    const { state } = this
    const { result } = state
    const fresh = result !== null && result.notation === state.notation
    const hasPresets = this.presets.length > 0
    return html`<div class="rsui rsui-mini">
      <div class="rsui-mini-row">
        ${notationField(state, { statusId: 'status', placeholder: this.placeholder })}
        ${rollButton(state, { tip: true })}
      </div>
      <div class="rsui-mini-foot">
        <span class="rsui-anchor">
          <button
            type="button"
            class="rsui-keys-toggle"
            aria-label="Dice keys"
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-controls="pad"
            @click=${() => {
              if (this._open) this.#closeKeys()
              else this.#openKeys()
            }}
          >
            ${dieGlyph()}
          </button>
          ${
            this._open
              ? html`<div id="pad" class="rsui-pop rsui-pop--keys" role="group" aria-label="Dice keys">
                ${keyPad(state, this.keys)}
                ${
                  hasPresets
                    ? html`<div class="rsui-pop-presets">
                      <p class="rsui-pop-label">${this.presetsLabel}</p>
                      ${presetList(state, this.presets, this.presetsLabel)}
                    </div>`
                    : nothing
                }
              </div>`
              : nothing
          }
        </span>
        ${statusLine(state.check, {
          id: 'status',
          hint: 'Type notation, or open the dice keys.',
          showValid: fresh
        })}
        ${
          this.appLink === undefined
            ? nothing
            : html`<a class="rsui-app-link" href=${this.appLink}>Open in the Roller</a>`
        }
      </div>
      ${this.#card('rsui-pop rsui-pop--result')}
    </div>`
  }

  #compact(): TemplateResult {
    const { state } = this
    const hasPresets = this.presets.length > 0
    const showPresets = hasPresets && this._tab === 'presets'
    const tab = (id: 'keys' | 'presets', label: string): TemplateResult =>
      html`<button
        type="button"
        role="tab"
        id=${`tab-${id}`}
        class="rsui-tab"
        aria-selected=${(id === 'presets') === showPresets ? 'true' : 'false'}
        aria-controls="panel"
        @click=${() => {
          this._tab = id
        }}
      >
        ${label}
      </button>`
    return html`<div class="rsui rsui-compact">
      <div class="rsui-compact-body">
        <div class="rsui-row">
          ${notationField(state, { statusId: 'status', placeholder: this.placeholder })}
          ${rollButton(state)}
        </div>
        <div class="rsui-compact-builder">
          ${statusLine(state.check, { id: 'status' })}
          ${
            hasPresets
              ? html`<div class="rsui-tabs" role="tablist" aria-label="Build with">
                ${tab('keys', 'Dice keys')} ${tab('presets', this.presetsLabel)}
              </div>`
              : nothing
          }
          <div
            id="panel"
            class="rsui-compact-panel"
            role=${hasPresets ? 'tabpanel' : nothing}
            aria-labelledby=${hasPresets ? `tab-${showPresets ? 'presets' : 'keys'}` : nothing}
          >
            ${
              showPresets
                ? presetList(state, this.presets, this.presetsLabel, this.presetsLayout)
                : keyPad(state, this.keys)
            }
          </div>
          ${this.#card('rsui-result-layer')}
        </div>
      </div>
      <div class="rsui-compact-footer" ?hidden=${this.appLink === undefined && !this._footer}>
        ${
          this.appLink === undefined
            ? nothing
            : html`<a class="rsui-app-link" href=${this.appLink}>Open the full app →</a>`
        }
        <span class="rsui-spacer"></span>
        <slot
          name="footer"
          @slotchange=${(event: Event) => {
            if (event.target instanceof HTMLSlotElement)
              this._footer = event.target.assignedNodes().length > 0
          }}
        ></slot>
      </div>
    </div>`
  }

  #historyList(entries: readonly HistoryEntry[]): TemplateResult {
    if (entries.length === 0) return html`<p class="rsui-recent-empty">${EMPTY_HISTORY}</p>`
    return html`<ol class="rsui-history-list">
      ${repeat(
        entries,
        entry => entry.id,
        entry => html`<li>
          <button
            type="button"
            class="rsui-history-item"
            aria-label=${`Roll ${entry.notation} again (last total ${entry.total})`}
            @click=${() => {
              this.#dialog()?.close?.()
              this.state.choose(entry)
            }}
          >
            <code class="rsui-history-notation">${entry.notation}</code>
            <span class="rsui-history-desc">${entry.description}</span>
            <span class="rsui-history-total">${entry.total}</span>
          </button>
        </li>`
      )}
    </ol>`
  }

  #dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector('dialog')
  }

  #max(): TemplateResult {
    const { state } = this
    const last = state.result
    const again =
      last === null
        ? nothing
        : html`<button
          type="button"
          class="rsui-quiet-button"
          @click=${() => {
            state.choose(last)
          }}
        >
          Roll again
        </button>`
    return html`<div class="rsui rsui-max">
      <div class="rsui-max-grid">
        <section class="rsui-max-builder" aria-label="Build a roll">
          <div class="rsui-row">
            ${notationField(state, { statusId: 'status', placeholder: this.placeholder })}
            ${rollButton(state)}
          </div>
          ${statusLine(state.check, { id: 'status' })} ${keyPad(state, this.keys)}
          ${
            this.presets.length > 0
              ? html`<div class="rsui-max-presets">
                <p class="rsui-pop-label">${this.presetsLabel}</p>
                ${presetList(state, this.presets, this.presetsLabel)}
              </div>`
              : nothing
          }
        </section>
        ${readout(state, again)} ${this.history ? this.#recent() : nothing}
      </div>
    </div>`
  }

  #recent(): TemplateResult {
    const history = this._history
    return html`<section class="rsui-recent" aria-label="Recent rolls">
      <div class="rsui-recent-head">
        <h2 class="rsui-recent-title">Recent</h2>
        <button
          type="button"
          class="rsui-quiet-button"
          aria-haspopup="dialog"
          @click=${() => {
            this.#dialog()?.showModal?.()
          }}
        >
          History
        </button>
      </div>
      ${this.#historyList(history.slice(0, RECENT))}
      <dialog
        class="rsui rsui-history"
        aria-labelledby="history-title"
        @click=${(event: MouseEvent) => {
          // A click on the backdrop lands on the dialog itself
          if (event.target === event.currentTarget) this.#dialog()?.close?.()
        }}
      >
        <div class="rsui-recent-head">
          <h2 id="history-title" class="rsui-recent-title">History</h2>
          ${
            history.length > 0
              ? html`<button
                type="button"
                class="rsui-quiet-button"
                @click=${() => {
                  this._history = []
                  saveHistory(this.storageKey, [])
                }}
              >
                Clear
              </button>`
              : nothing
          }
          <button
            type="button"
            class="rsui-quiet-button"
            @click=${() => {
              this.#dialog()?.close?.()
            }}
          >
            Done
          </button>
        </div>
        ${this.#historyList(history)}
      </dialog>
    </section>`
  }
}

define('randsum-roller', RandsumRoller)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-roller': RandsumRoller
  }
}
