import type {
  ComparisonOptions,
  ModifierOptions,
  RerollOptions,
  RollOptions,
  RollerRollResult
} from '../types'
import { roll } from '../roll'

/**
 * Fluent builder for constructing RollOptions without deep object literals.
 * Each method returns a new builder instance — the original is unchanged.
 *
 * @example
 * ```ts
 * d(6).quantity(4).drop(1).plus(2).toRoll()
 * d(20).cap({ greaterThan: 18 }).build()
 * ```
 */
export class DiceBuilder {
  private readonly opts: RollOptions

  constructor(opts: RollOptions) {
    this.opts = opts
  }

  public quantity(n: number): DiceBuilder {
    return new DiceBuilder({ ...this.opts, quantity: n })
  }

  public drop(lowest: number): DiceBuilder {
    return this.merge({ drop: { lowest } })
  }

  public dropHighest(n: number): DiceBuilder {
    return this.merge({ drop: { highest: n } })
  }

  public keep(highest: number): DiceBuilder {
    return this.merge({ keep: { highest } })
  }

  public keepLowest(n: number): DiceBuilder {
    return this.merge({ keep: { lowest: n } })
  }

  public plus(n: number): DiceBuilder {
    return this.merge({ plus: n })
  }

  public minus(n: number): DiceBuilder {
    return this.merge({ minus: n })
  }

  public cap(options: ComparisonOptions): DiceBuilder {
    return this.merge({ cap: options })
  }

  public reroll(options: RerollOptions): DiceBuilder {
    return this.merge({ reroll: options })
  }

  public explode(): DiceBuilder {
    return this.merge({ explode: true })
  }

  public unique(): DiceBuilder {
    return this.merge({ unique: true })
  }

  public build(): RollOptions {
    return { ...this.opts }
  }

  public toRoll(): RollerRollResult {
    return roll(this.opts)
  }

  private merge(modifier: Partial<ModifierOptions>): DiceBuilder {
    return new DiceBuilder({
      ...this.opts,
      modifiers: { ...this.opts.modifiers, ...modifier }
    })
  }
}

/**
 * Create a DiceBuilder for the given number of sides.
 *
 * @example
 * ```ts
 * d(6)                           // 1d6
 * d(20).plus(5).toRoll()         // 1d20+5, immediately rolled
 * d(6).quantity(4).drop(1)       // 4d6 drop lowest (= 4d6L)
 * ```
 */
export function d(sides: number): DiceBuilder {
  return new DiceBuilder({ sides, quantity: 1 })
}
