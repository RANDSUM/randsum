export interface ModifierDoc {
  readonly title: string
  readonly description: string
  readonly displayBase: string
  readonly displayOptional?: string
  readonly forms: readonly { readonly notation: string; readonly note: string }[]
  readonly comparisons?: readonly { readonly operator: string; readonly note: string }[]
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
    displayOptional: 'n',
    forms: [{ notation: 'L(n)', note: 'Drop n lowest (default: 1)' }],
    examples: [
      { notation: '4d6L', description: 'Roll 4d6, drop lowest (ability scores)' },
      { notation: '5d6L2', description: 'Roll 5d6, drop 2 lowest' }
    ]
  },
  H: {
    title: 'Drop Highest',
    description: 'Remove the highest-valued dice from the pool before summing.',
    displayBase: 'H',
    displayOptional: 'n',
    forms: [{ notation: 'H(n)', note: 'Drop n highest (default: 1)' }],
    examples: [
      { notation: '2d20H', description: 'Roll 2d20, drop highest (disadvantage)' },
      { notation: '4d6H', description: 'Roll 4d6, drop highest' }
    ]
  },
  K: {
    title: 'Keep Highest',
    description: 'Keep only the n highest-valued dice; discard the rest.',
    displayBase: 'K',
    displayOptional: 'n',
    forms: [{ notation: 'K(n)', note: 'Keep n highest (default: 1)' }],
    examples: [
      { notation: '2d20K', description: 'Roll 2d20, keep highest (advantage)' },
      { notation: '4d6K3', description: 'Roll 4d6, keep highest 3' }
    ]
  },
  kl: {
    title: 'Keep Lowest',
    description: 'Keep only the n lowest-valued dice; discard the rest.',
    displayBase: 'kl',
    displayOptional: 'n',
    forms: [{ notation: 'kl(n)', note: 'Keep n lowest (default: 1)' }],
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
    displayOptional: 'n',
    forms: [
      { notation: '!!(n)', note: 'Compound up to n times (default: once)' },
      { notation: '!!0', note: 'Unlimited depth (capped at 100)' }
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
    displayOptional: 'n',
    forms: [
      { notation: '!p(n)', note: 'Penetrate up to n times (default: once)' },
      { notation: '!p0', note: 'Unlimited depth (capped at 100)' }
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
    forms: [{ notation: 'U({..})', note: 'All unique; optional exceptions list' }],
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
    forms: [{ notation: 'V{...}', note: 'Comma-separate multiple rules' }],
    comparisons: [
      { operator: 'n=y', note: 'replace exact match n with y' },
      { operator: '>n=y', note: 'replace anything above n with y' },
      { operator: '<n=y', note: 'replace anything below n with y' }
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
      { notation: 'S{n}', note: 'Single success threshold' },
      { notation: 'S{n,b}', note: 'Threshold + botch threshold' }
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
    displayOptional: 'n',
    forms: [{ notation: '**n', note: 'Multiply final total by n' }],
    examples: [
      { notation: '2d6+3**2', description: '(roll + 3) × 2' },
      { notation: '4d6L**3', description: '(drop-lowest sum) × 3' }
    ]
  },
  '*': {
    title: 'Multiply Dice',
    description: 'Multiply the dice sum before applying +/− arithmetic modifiers.',
    displayBase: '*',
    displayOptional: 'n',
    forms: [{ notation: '*n', note: 'Multiply dice sum by n (pre-arithmetic)' }],
    examples: [
      { notation: '2d6*2+3', description: '(roll × 2) + 3' },
      { notation: '4d6*3', description: 'Triple the dice sum' }
    ]
  },
  '\u2013': {
    title: 'Subtract',
    description: 'Subtract a fixed number from the total after all dice are rolled.',
    displayBase: '−',
    displayOptional: 'n',
    forms: [{ notation: '-n', note: 'Subtract n from total' }],
    examples: [
      { notation: '1d20-2', description: 'Roll 1d20, subtract 2' },
      { notation: '4d6L-1', description: 'Drop lowest, subtract 1' }
    ]
  },
  '+': {
    title: 'Add',
    description: 'Add a fixed number to the total after all dice are rolled.',
    displayBase: '+',
    displayOptional: 'n',
    forms: [{ notation: '+n', note: 'Add n to total' }],
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
    forms: [{ notation: 'C{...}', note: 'Comma-separate multiple conditions' }],
    comparisons: [
      { operator: '>n', note: 'cap: clamp anything above n down to n' },
      { operator: '<n', note: 'floor: clamp anything below n up to n' }
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
      { notation: 'R{...}', note: 'Reroll until result no longer matches' },
      { notation: 'R{...}(d)', note: 'Max d reroll attempts' }
    ],
    comparisons: [
      { operator: 'n', note: 'reroll dice showing exactly n' },
      { operator: '>n', note: 'reroll dice showing more than n' },
      { operator: '<n', note: 'reroll dice showing less than n' }
    ],
    examples: [
      { notation: '4d6R{1}', description: 'Reroll any 1s' },
      { notation: '2d10R{<3}', description: 'Reroll results under 3' },
      { notation: '4d6R{<3}2', description: 'Reroll under 3, max 2 attempts' }
    ]
  }
}
