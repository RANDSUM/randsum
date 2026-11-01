// The roller's state with no framework: the notation, its check, the last
// result and the actions. Every element renders from one, and the React and
// Vue wrappers hand one to the parts so they can share it.
import type { Token } from '@randsum/roller/tokenize'
import { tokenize } from '@randsum/roller/tokenize'
import { checkNotation, rollNotation } from './check'
import type { NotationCheck, RollResult } from './check'
import { applyKey } from './keys'
import type { Key } from './keys'
import type { Preset } from './presets'

export type { NotationCheck, RollResult } from './check'
export type { Key } from './keys'
export type { Preset } from './presets'

export type RollerEvent =
  /** A user edit: typing, a key, or a preset. */
  | { readonly type: 'change'; readonly notation: string }
  /** The host set the notation; nothing to announce. */
  | { readonly type: 'set'; readonly notation: string }
  | { readonly type: 'roll'; readonly result: RollResult }

export type RollerListener = (event: RollerEvent) => void

export class RollerState {
  #notation: string
  #tokens: readonly Token[]
  #check: NotationCheck
  #result: RollResult | null = null
  readonly #listeners = new Set<RollerListener>()

  constructor(notation = '') {
    this.#notation = notation
    this.#tokens = tokenize(notation)
    this.#check = checkNotation(notation)
  }

  get notation(): string {
    return this.#notation
  }

  get tokens(): readonly Token[] {
    return this.#tokens
  }

  get check(): NotationCheck {
    return this.#check
  }

  get result(): RollResult | null {
    return this.#result
  }

  /** Called on every edit and roll. Returns the unsubscribe. */
  subscribe(listener: RollerListener): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Sets the notation without announcing it, for a host that owns the value. */
  set(notation: string): void {
    if (this.#update(notation)) this.#emit({ type: 'set', notation })
  }

  /** A user edit: typing, a key, or a preset. */
  edit(next: string): void {
    if (this.#update(next)) this.#emit({ type: 'change', notation: next })
  }

  #update(notation: string): boolean {
    if (notation === this.#notation) return false
    this.#notation = notation
    this.#tokens = tokenize(notation)
    this.#check = checkNotation(notation)
    return true
  }

  /** Rolls the current notation, if it is valid. */
  roll(): void {
    this.#rollThis(this.#notation)
  }

  press(key: Key): void {
    this.edit(applyKey(this.#notation, key))
  }

  /** Sets a preset's notation and rolls it. */
  choose(preset: Pick<Preset, 'notation'>): void {
    this.edit(preset.notation)
    this.#rollThis(preset.notation)
  }

  #rollThis(value: string): void {
    if (checkNotation(value).kind !== 'valid') return
    const rolled = rollNotation(value)
    if (rolled === null) return
    this.#result = rolled
    this.#emit({ type: 'roll', result: rolled })
  }

  #emit(event: RollerEvent): void {
    for (const listener of this.#listeners) listener(event)
  }
}
