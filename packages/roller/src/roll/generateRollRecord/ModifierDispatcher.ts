import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../types'
import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../../lib/modifiers'

/**
 * Context for modifier application
 */
export interface ModifierContext {
  sides: number
  quantity: number
  rollOne: () => number
}

export interface ModifierHandler {
  apply(
    modifierValue: unknown,
    currentBonuses: NumericRollBonus,
    context: ModifierContext
  ): NumericRollBonus
}

class PlusModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: unknown,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return {
      rolls: currentBonuses.rolls,
      simpleMathModifier: Number(modifierValue),
      logs: currentBonuses.logs
    }
  }
}

class MinusModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: unknown,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return {
      rolls: currentBonuses.rolls,
      simpleMathModifier: -Number(modifierValue),
      logs: currentBonuses.logs
    }
  }
}

class RerollModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: RerollOptions | undefined,
    currentBonuses: NumericRollBonus,
    context: ModifierContext
  ): NumericRollBonus {
    return new RerollModifier(modifierValue).apply(
      currentBonuses,
      undefined,
      context.rollOne
    )
  }
}

class UniqueModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: boolean | UniqueOptions | undefined,
    currentBonuses: NumericRollBonus,
    context: ModifierContext
  ): NumericRollBonus {
    return new UniqueModifier(modifierValue).apply(
      currentBonuses,
      { sides: context.sides, quantity: context.quantity },
      context.rollOne
    )
  }
}

class ReplaceModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: ReplaceOptions | ReplaceOptions[] | undefined,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return new ReplaceModifier(modifierValue).apply(currentBonuses)
  }
}

class CapModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: ComparisonOptions | undefined,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return new CapModifier(modifierValue).apply(currentBonuses)
  }
}

class DropModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: DropOptions | undefined,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return new DropModifier(modifierValue).apply(currentBonuses)
  }
}

class ExplodeModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: boolean | undefined,
    currentBonuses: NumericRollBonus,
    context: ModifierContext
  ): NumericRollBonus {
    return new ExplodeModifier(modifierValue).apply(
      currentBonuses,
      { sides: context.sides, quantity: context.quantity },
      context.rollOne
    )
  }
}

class ModifierDispatcherClass {
  private readonly handlers = new Map<keyof ModifierOptions, ModifierHandler>()

  constructor() {
    this.initializeHandlers()
  }

  private initializeHandlers(): void {
    this.handlers.set('plus', new PlusModifierHandler())
    this.handlers.set('minus', new MinusModifierHandler())
    this.handlers.set('reroll', new RerollModifierHandler())
    this.handlers.set('unique', new UniqueModifierHandler())
    this.handlers.set('replace', new ReplaceModifierHandler())
    this.handlers.set('cap', new CapModifierHandler())
    this.handlers.set('drop', new DropModifierHandler())
    this.handlers.set('explode', new ExplodeModifierHandler())
  }

  public dispatch(
    key: keyof ModifierOptions,
    modifierValue: unknown,
    currentBonuses: NumericRollBonus,
    context: ModifierContext
  ): NumericRollBonus {
    const handler = this.handlers.get(key)

    if (!handler) {
      throw new Error(`Unknown modifier: ${String(key)}`)
    }

    return handler.apply(modifierValue, currentBonuses, context)
  }
}

export const ModifierDispatcher: ModifierDispatcherClass =
  new ModifierDispatcherClass()
