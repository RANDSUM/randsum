import type { ModifierOptions, NumericRollBonus } from '../../types'
import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../../lib'

/**
 * Context for modifier application
 */
export interface ModifierContext {
  sides: number
  quantity: number
  rollOne: () => number
}

/**
 * Interface for modifier handlers
 */
export interface ModifierHandler {
  apply(
    modifierValue: unknown,
    currentBonuses: NumericRollBonus,
    context: ModifierContext
  ): NumericRollBonus
}

/**
 * Handler for plus modifier - maintains original behavior without logs
 */
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

/**
 * Handler for minus modifier - maintains original behavior without logs
 */
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

/**
 * Handler for reroll modifier
 */
class RerollModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: undefined,
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

/**
 * Handler for unique modifier
 */
class UniqueModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: undefined,
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

/**
 * Handler for replace modifier
 */
class ReplaceModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: undefined,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return new ReplaceModifier(modifierValue).apply(currentBonuses)
  }
}

/**
 * Handler for cap modifier
 */
class CapModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: undefined,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return new CapModifier(modifierValue).apply(currentBonuses)
  }
}

/**
 * Handler for drop modifier
 */
class DropModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: undefined,
    currentBonuses: NumericRollBonus,
    _context: ModifierContext
  ): NumericRollBonus {
    return new DropModifier(modifierValue).apply(currentBonuses)
  }
}

/**
 * Handler for explode modifier
 */
class ExplodeModifierHandler implements ModifierHandler {
  public apply(
    modifierValue: undefined,
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

/**
 * Polymorphic dispatcher for modifier application
 */
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
