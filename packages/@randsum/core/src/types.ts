export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`

export interface RollConfig {
  quantity: number
  sides: number
  modifiers: Modifiers
}

export type Modifiers = {
  cap?: GreaterLessOptions
  drop?: DropOptions
  replace?: ReplaceOptions | ReplaceOptions[]
  reroll?: RerollOptions
  unique?: boolean | UniqueOptions
  explode?: boolean
  plus?: number
  minus?: number
}

export interface GreaterLessOptions {
  greaterThan?: number
  lessThan?: number
}
export interface DropOptions extends GreaterLessOptions {
  highest?: number
  lowest?: number
  exact?: number[]
}

export interface RerollOptions extends GreaterLessOptions {
  exact?: number[]
  maxReroll?: number
}

export interface ReplaceOptions {
  from: number | GreaterLessOptions
  to: number
}

export interface UniqueOptions {
  notUnique: number[]
}

type CoreRollOptions = Omit<RollConfig, 'modifiers'>

export type RequiredCoreDiceParameters = {
  [Property in keyof CoreRollOptions]-?: CoreRollOptions[Property]
}
