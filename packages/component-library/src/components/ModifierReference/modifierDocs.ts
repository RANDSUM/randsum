export interface ModifierDoc {
  readonly title: string
  readonly description: string
  readonly displayBase: string
  readonly displayOptional?: string
  readonly forms: readonly { readonly notation: string; readonly note: string }[]
  readonly examples: readonly { readonly notation: string; readonly description: string }[]
}

export const MODIFIER_DOCS: Readonly<Record<string, ModifierDoc>> = {
  xDY: {
    title: 'Core Roll',
    description: 'Roll N dice with S sides each. The foundation of every notation string.',
    displayBase: 'NdS',
    forms: [{ notation: 'NdS', note: 'Roll N dice, S sides each' }],
    examples: [
      { notation: '1d20', description: 'Roll one d20' },
      { notation: '4d6', description: 'Roll four d6' },
      { notation: '2d8', description: 'Roll two d8' }
    ]
  },
  L: {
    title: 'Drop Lowest',
    description: 'Remove the lowest-valued dice from the pool before summing.',
    displayBase: 'L',
    displayOptional: 'N',
    forms: [
      { notation: 'L', note: 'No argument — drop 1 lowest' },
      { notation: 'LN', note: 'Drop N lowest' }
    ],
    examples: [
      { notation: '4d6L', description: 'Roll 4d6, drop lowest (ability scores)' },
      { notation: '5d6L2', description: 'Roll 5d6, drop 2 lowest' }
    ]
  },
  H: {
    title: 'Drop Highest',
    description: 'Remove the highest-valued dice from the pool before summing.',
    displayBase: 'H',
    displayOptional: 'N',
    forms: [
      { notation: 'H', note: 'No argument — drop 1 highest' },
      { notation: 'HN', note: 'Drop N highest' }
    ],
    examples: [
      { notation: '2d20H', description: 'Roll 2d20, drop highest (disadvantage)' },
      { notation: '4d6H', description: 'Roll 4d6, drop highest' }
    ]
  },
  K: {
    title: 'Keep Highest',
    description: 'Keep only the N highest-valued dice; discard the rest.',
    displayBase: 'K',
    displayOptional: 'N',
    forms: [
      { notation: 'K', note: 'No argument — keep 1 highest' },
      { notation: 'KN', note: 'Keep N highest' }
    ],
    examples: [
      { notation: '2d20K', description: 'Roll 2d20, keep highest (advantage)' },
      { notation: '4d6K3', description: 'Roll 4d6, keep highest 3' }
    ]
  },
  kl: {
    title: 'Keep Lowest',
    description: 'Keep only the N lowest-valued dice; discard the rest.',
    displayBase: 'kl',
    displayOptional: 'N',
    forms: [
      { notation: 'kl', note: 'No argument — keep 1 lowest' },
      { notation: 'klN', note: 'Keep N lowest' }
    ],
    examples: [
      { notation: '2d20kl', description: 'Roll 2d20, keep lowest (disadvantage)' },
      { notation: '4d6kl2', description: 'Roll 4d6, keep 2 lowest' }
    ]
  },
  '!': {
    title: 'Explode',
    description:
      'Each die showing its maximum value triggers an extra die roll. Continues if new dice also max.',
    displayBase: '!',
    forms: [{ notation: '!', note: 'Explode on max value' }],
    examples: [
      { notation: '3d6!', description: 'Roll 3d6; any 6 adds another d6' },
      { notation: '4d6L!', description: 'Roll 4d6, explode, then drop lowest' }
    ]
  },
  '!!': {
    title: 'Compound Explode',
    description:
      'Like explode, but extra rolls add to the triggering die rather than creating new dice.',
    displayBase: '!!',
    displayOptional: 'N',
    forms: [
      { notation: '!!', note: 'No argument — compound once on max' },
      { notation: '!!N', note: 'Compound up to N times' },
      { notation: '!!0', note: 'Unlimited (capped at 100)' }
    ],
    examples: [
      { notation: '3d6!!', description: 'Roll 3d6; 6s add to themselves' },
      { notation: '1d8!!5', description: 'Roll 1d8, compound up to 5 times' }
    ]
  },
  '!p': {
    title: 'Penetrating Explode',
    description:
      'Like explode, but each subsequent explosion subtracts 1 from the result (Hackmaster-style).',
    displayBase: '!p',
    displayOptional: 'N',
    forms: [
      { notation: '!p', note: 'No argument — penetrate once' },
      { notation: '!pN', note: 'Penetrate up to N times' },
      { notation: '!p0', note: 'Unlimited (capped at 100)' }
    ],
    examples: [
      { notation: '1d6!p', description: 'Roll 1d6; max penetrates with -1 per chain' },
      { notation: '2d6!pL', description: 'Penetrate, then drop lowest' }
    ]
  },
  U: {
    title: 'Unique',
    description: 'Force all dice in the pool to show different values by rerolling duplicates.',
    displayBase: 'U',
    displayOptional: '{..}',
    forms: [
      { notation: 'U', note: 'No argument — all values must be unique' },
      { notation: 'U{X,...}', note: 'Allow listed values to repeat' }
    ],
    examples: [
      { notation: '4d20U', description: 'Roll 4d20, no duplicate results' },
      { notation: '4d6U{1}', description: 'Unique except 1s may repeat' }
    ]
  },
  'V{..}': {
    title: 'Replace',
    description: 'Replace dice showing specific values with a new value.',
    displayBase: 'V',
    displayOptional: '{..}',
    forms: [
      { notation: 'V{X=Y}', note: 'Single rule' },
      { notation: 'V{X=Y,A=B,...}', note: 'Multiple rules' }
    ],
    examples: [
      { notation: '4d6V{1=2}', description: 'Replace 1s with 2' },
      { notation: '4d20V{>18=20}', description: 'Cap 19s and 20s to 20' }
    ]
  },
  'S{..}': {
    title: 'Count Successes',
    description:
      'Count dice that meet a threshold instead of summing values — used in dice pool systems.',
    displayBase: 'S',
    displayOptional: '{..}',
    forms: [
      { notation: 'S{N}', note: 'Single success threshold' },
      { notation: 'S{N,B}', note: 'Threshold + botch threshold' }
    ],
    examples: [
      { notation: '5d10S{7}', description: 'Count dice that rolled 7 or higher' },
      { notation: '5d10S{7,1}', description: 'Successes ≥ 7, subtract botches ≤ 1' }
    ]
  },
  '**': {
    title: 'Multiply Total',
    description: 'Multiply the entire final total after all other modifiers have been applied.',
    displayBase: '**',
    displayOptional: 'N',
    forms: [{ notation: '**N', note: 'Multiply final total by N' }],
    examples: [
      { notation: '2d6+3**2', description: '(roll + 3) × 2' },
      { notation: '4d6L**3', description: '(drop-lowest sum) × 3' }
    ]
  },
  '*': {
    title: 'Multiply Dice',
    description: 'Multiply the dice sum before applying +/− arithmetic modifiers.',
    displayBase: '*',
    displayOptional: 'N',
    forms: [{ notation: '*N', note: 'Multiply dice sum by N (pre-arithmetic)' }],
    examples: [
      { notation: '2d6*2+3', description: '(roll × 2) + 3' },
      { notation: '4d6*3', description: 'Triple the dice sum' }
    ]
  },
  '\u2013': {
    title: 'Subtract',
    description: 'Subtract a fixed number from the total after all dice are rolled.',
    displayBase: '−',
    displayOptional: 'N',
    forms: [{ notation: '-N', note: 'Subtract N from total' }],
    examples: [
      { notation: '1d20-2', description: 'Roll 1d20, subtract 2' },
      { notation: '4d6L-1', description: 'Drop lowest, subtract 1' }
    ]
  },
  '+': {
    title: 'Add',
    description: 'Add a fixed number to the total after all dice are rolled.',
    displayBase: '+',
    displayOptional: 'N',
    forms: [{ notation: '+N', note: 'Add N to total' }],
    examples: [
      { notation: '1d20+5', description: 'Roll 1d20, add 5' },
      { notation: '2d6+3', description: 'Roll 2d6, add 3' }
    ]
  },
  'C{..}': {
    title: 'Cap',
    description:
      'Clamp individual die values to a range — dice outside the boundary are moved to it.',
    displayBase: 'C',
    displayOptional: '{..}',
    forms: [
      { notation: 'C{N}', note: 'Single cap value' },
      { notation: 'C{<N,>M}', note: 'Floor and ceiling' }
    ],
    examples: [
      { notation: '4d6C{>5}', description: 'Cap rolls: nothing exceeds 5' },
      { notation: '4d20C{<3,>18}', description: 'Clamp rolls to [3, 18]' }
    ]
  },
  'R{..}': {
    title: 'Reroll',
    description:
      'Reroll dice that match a condition. The new result stands (may reroll again if still matching).',
    displayBase: 'R',
    displayOptional: '{..}',
    forms: [
      { notation: 'R{..}', note: 'Reroll matching dice' },
      { notation: 'R{..}N', note: 'Reroll, max N attempts' }
    ],
    examples: [
      { notation: '4d6R{1}', description: 'Reroll any 1s' },
      { notation: '2d10R{<3}', description: 'Reroll results under 3' },
      { notation: '4d6R{<3}2', description: 'Reroll under 3, max 2 attempts' }
    ]
  }
}
