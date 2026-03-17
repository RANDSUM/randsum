export interface ModifierDoc {
  readonly title: string
  readonly description: string
  readonly displayBase: string
  readonly displayOptional?: string
  readonly forms: readonly {
    readonly notation: string
    readonly note: string
  }[]
  readonly comparisons?: readonly {
    readonly operator: string
    readonly note: string
  }[]
  readonly examples: readonly {
    readonly notation: string
    readonly description: string
  }[]
}

export const MODIFIER_DOCS: Readonly<Record<string, ModifierDoc>> = {
  'D{..}': {
    title: 'Drop by Condition',
    description:
      'Drop any dice matching a condition \u2014 more flexible than L/H for arbitrary thresholds.',
    displayBase: 'D{..}',
    forms: [{ notation: 'D{...}', note: 'Comma-separate multiple conditions' }],
    comparisons: [
      { operator: 'n', note: 'drop dice showing exactly n' },
      { operator: '>n', note: 'drop dice showing more than n' },
      { operator: '>=n', note: 'drop dice showing n or more' },
      { operator: '<n', note: 'drop dice showing less than n' },
      { operator: '<=n', note: 'drop dice showing n or less' }
    ],
    examples: [
      { notation: '4d6D{1}', description: 'Drop all 1s' },
      { notation: '4d6D{>=5}', description: 'Drop all 5s and above' },
      {
        notation: '4d6D{<=2}',
        description: 'Drop any result of 2 or lower'
      },
      { notation: '4d6D{1,6}', description: 'Drop multiple' }
    ]
  },
  xDN: {
    title: 'Core Roll',
    description: 'Roll x dice with N sides each. The foundation of every notation string.',
    displayBase: 'xDN',
    forms: [{ notation: 'xDN', note: 'Roll x dice, N sides each' }],
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
      {
        notation: '4d6L',
        description: 'Roll 4d6, drop lowest (ability scores)'
      },
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
      {
        notation: '2d20H',
        description: 'Roll 2d20, drop highest (disadvantage)'
      },
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
      {
        notation: '2d20K',
        description: 'Roll 2d20, keep highest (advantage)'
      },
      { notation: '4d6K3', description: 'Roll 4d6, keep highest 3' }
    ]
  },
  KL: {
    title: 'Keep Lowest',
    description: 'Keep only the n lowest-valued dice; discard the rest.',
    displayBase: 'KL',
    displayOptional: 'n',
    forms: [{ notation: 'KL(n)', note: 'Keep n lowest (default: 1)' }],
    examples: [
      {
        notation: '2d20KL',
        description: 'Roll 2d20, keep lowest (disadvantage)'
      },
      { notation: '4d6KL2', description: 'Roll 4d6, keep 2 lowest' }
    ]
  },
  KM: {
    title: 'Keep Middle',
    description:
      'Keep N dice closest to the middle of the pool by dropping equal numbers from both ends. Sugar for Drop lowest + Drop highest.',
    displayBase: 'KM',
    displayOptional: 'n',
    forms: [
      {
        notation: 'KM(n)',
        note: 'Keep middle n (default: pool - 2)'
      }
    ],
    examples: [
      {
        notation: '5d6KM3',
        description: 'Keep 3 middle dice'
      },
      { notation: '4d6KM', description: 'Keep middle 2' }
    ]
  },
  '!': {
    title: 'Explode',
    description:
      'Each die showing its maximum value triggers an extra die roll. Continues if new dice also max.',
    displayBase: '!',
    forms: [{ notation: '!', note: 'Explode on max value' }],
    examples: [
      {
        notation: '3d6!',
        description: 'Roll 3d6; any 6 adds another d6'
      },
      {
        notation: '4d6L!',
        description: 'Roll 4d6, explode, then drop lowest'
      }
    ]
  },
  '!!': {
    title: 'Compound Explode',
    description:
      'Like explode, but extra rolls add to the triggering die rather than creating new dice.',
    displayBase: '!!',
    displayOptional: 'n',
    forms: [
      {
        notation: '!!(n)',
        note: 'Compound up to n times (default: once)'
      },
      { notation: '!!0', note: 'Unlimited depth (capped at 100)' }
    ],
    examples: [
      {
        notation: '3d6!!',
        description: 'Roll 3d6; 6s add to themselves'
      },
      {
        notation: '1d8!!5',
        description: 'Roll 1d8, compound up to 5 times'
      }
    ]
  },
  '!s{..}': {
    title: 'Explode Sequence',
    description:
      'On max, re-roll with the next die size in a custom sequence rather than reusing the same die.',
    displayBase: '!s{..}',
    forms: [
      {
        notation: '!s{N1,N2,...}',
        note: 'Step through die sizes on each explosion'
      }
    ],
    examples: [
      {
        notation: '1d4!s{4,6,8,10}',
        description: 'Explode through d4, d6, d8, d10'
      },
      {
        notation: '1d6!s{8,12}',
        description: 'Explode to d8, then d12'
      }
    ]
  },
  '!i': {
    title: 'Inflation',
    description:
      'Explode upward through the TTRPG standard die set (4, 6, 8, 10, 12, 20, 100). Sugar for Explode Sequence going up.',
    displayBase: '!i',
    forms: [
      {
        notation: '!i',
        note: 'Inflate through standard dice sizes'
      }
    ],
    examples: [
      {
        notation: '1d4!i',
        description: 'Explode d4 through d6, d8, d10, d12, d20'
      }
    ]
  },
  '!r': {
    title: 'Reduction',
    description:
      'Explode downward through the TTRPG standard die set (4, 6, 8, 10, 12, 20, 100). Sugar for Explode Sequence going down.',
    displayBase: '!r',
    forms: [
      {
        notation: '!r',
        note: 'Reduce through standard dice sizes'
      }
    ],
    examples: [
      {
        notation: '1d20!r',
        description: 'Explode d20 through d12, d10, d8, d6, d4'
      }
    ]
  },
  '!p': {
    title: 'Penetrating Explode',
    description:
      'Like explode, but each subsequent explosion subtracts 1 from the result (Hackmaster-style).',
    displayBase: '!p',
    displayOptional: 'n',
    forms: [
      {
        notation: '!p(n)',
        note: 'Penetrate up to n times (default: once)'
      },
      { notation: '!p0', note: 'Unlimited depth (capped at 100)' }
    ],
    examples: [
      {
        notation: '1d6!p',
        description: 'Roll 1d6; max penetrates with -1 per chain'
      },
      {
        notation: '2d6!pL',
        description: 'Penetrate, then drop lowest'
      }
    ]
  },
  U: {
    title: 'Unique',
    description: 'Force all dice in the pool to show different values by rerolling duplicates.',
    displayBase: 'U',
    displayOptional: '{..}',
    forms: [
      {
        notation: 'U({..})',
        note: 'All unique; optional exceptions list'
      }
    ],
    examples: [
      {
        notation: '4d20U',
        description: 'Roll 4d20, no duplicate results'
      },
      {
        notation: '4d6U{1}',
        description: 'Unique except 1s may repeat'
      }
    ]
  },
  'V{..}': {
    title: 'Replace',
    description: 'Replace dice showing specific values with a new value.',
    displayBase: 'V{..}',
    forms: [{ notation: 'V{...}', note: 'Comma-separate multiple rules' }],
    comparisons: [
      { operator: 'n=y', note: 'replace exact match n with y' },
      { operator: '>n=y', note: 'replace anything above n with y' },
      { operator: '>=n=y', note: 'replace n or higher with y' },
      { operator: '<n=y', note: 'replace anything below n with y' },
      { operator: '<=n=y', note: 'replace n or lower with y' }
    ],
    examples: [
      { notation: '4d6V{1=2}', description: 'Replace 1s with 2' },
      {
        notation: '4d20V{>18=20}',
        description: 'Cap 19s and 20s to 20'
      },
      {
        notation: '4d6V{1=2,6=5}',
        description: 'Replace multiple'
      }
    ]
  },
  'S{..}': {
    title: 'Count Successes',
    description:
      'Count dice that meet a threshold instead of summing values \u2014 used in dice pool systems.',
    displayBase: 'S{..}',
    forms: [
      { notation: 'S{n}', note: 'Single success threshold' },
      {
        notation: 'S{n,b}',
        note: 'Threshold + botch threshold'
      }
    ],
    examples: [
      {
        notation: '5d10S{7}',
        description: 'Count dice that rolled 7 or higher'
      },
      {
        notation: '5d10S{7,1}',
        description: 'Successes \u2265 7, subtract botches \u2264 1'
      }
    ]
  },
  '**': {
    title: 'Multiply Total',
    description: 'Multiply the entire final total after all other modifiers have been applied.',
    displayBase: '**',
    displayOptional: 'n',
    forms: [{ notation: '**n', note: 'Multiply final total by n' }],
    examples: [
      { notation: '2d6+3**2', description: '(roll + 3) \u00d7 2' },
      {
        notation: '4d6L**3',
        description: '(drop-lowest sum) \u00d7 3'
      }
    ]
  },
  '*': {
    title: 'Multiply Dice',
    description: 'Multiply the dice sum before applying +/\u2212 arithmetic modifiers.',
    displayBase: '*',
    displayOptional: 'n',
    forms: [
      {
        notation: '*n',
        note: 'Multiply dice sum by n (pre-arithmetic)'
      }
    ],
    examples: [
      { notation: '2d6*2+3', description: '(roll \u00d7 2) + 3' },
      { notation: '4d6*3', description: 'Triple the dice sum' }
    ]
  },
  '-': {
    title: 'Subtract',
    description: 'Subtract a fixed number from the total after all dice are rolled.',
    displayBase: '\u2212',
    displayOptional: 'n',
    forms: [{ notation: '-n', note: 'Subtract n from total' }],
    examples: [
      {
        notation: '1d20-2',
        description: 'Roll 1d20, subtract 2'
      },
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
      'Clamp individual die values to a range \u2014 dice outside the boundary are moved to it.',
    displayBase: 'C{..}',
    forms: [{ notation: 'C{...}', note: 'Comma-separate multiple conditions' }],
    comparisons: [
      { operator: 'n', note: 'max cap: no result exceeds n' },
      {
        operator: '>n',
        note: 'cap: clamp anything above n down to n'
      },
      {
        operator: '>=n',
        note: 'cap: clamp n and above down to n'
      },
      {
        operator: '<n',
        note: 'floor: clamp anything below n up to n'
      },
      {
        operator: '<=n',
        note: 'floor: clamp n and below up to n'
      }
    ],
    examples: [
      {
        notation: '4d6C{>5}',
        description: 'Cap rolls: nothing exceeds 5'
      },
      {
        notation: '4d20C{<3,>18}',
        description: 'Clamp rolls to [3, 18]'
      }
    ]
  },
  'R{..}': {
    title: 'Reroll',
    description:
      'Reroll dice that match a condition. The new result stands (may reroll again if still matching).',
    displayBase: 'R{..}',
    forms: [
      {
        notation: 'R{...}',
        note: 'Reroll until result no longer matches'
      },
      { notation: 'R{...}(d)', note: 'Max d reroll attempts' }
    ],
    comparisons: [
      { operator: 'n', note: 'reroll dice showing exactly n' },
      { operator: '>n', note: 'reroll dice showing more than n' },
      {
        operator: '>=n',
        note: 'reroll dice showing n or more'
      },
      {
        operator: '<n',
        note: 'reroll dice showing less than n'
      },
      {
        operator: '<=n',
        note: 'reroll dice showing n or less'
      }
    ],
    examples: [
      { notation: '4d6R{1}', description: 'Reroll any 1s' },
      {
        notation: '2d10R{<3}',
        description: 'Reroll results under 3'
      },
      {
        notation: '4d6R{<3}2',
        description: 'Reroll under 3, max 2 attempts'
      }
    ]
  },
  'ro{..}': {
    title: 'Reroll Once',
    description:
      'Reroll dice matching a condition with a maximum of 1 attempt. Sugar for Reroll with max=1.',
    displayBase: 'ro{..}',
    forms: [
      {
        notation: 'ro{...}',
        note: 'Reroll once if condition met'
      }
    ],
    comparisons: [
      { operator: 'n', note: 'reroll dice showing exactly n' },
      { operator: '>n', note: 'reroll dice showing more than n' },
      {
        operator: '>=n',
        note: 'reroll dice showing n or more'
      },
      {
        operator: '<n',
        note: 'reroll dice showing less than n'
      },
      {
        operator: '<=n',
        note: 'reroll dice showing n or less'
      }
    ],
    examples: [
      { notation: '4d6ro{1}', description: 'Reroll 1s once' },
      {
        notation: '2d10ro{<3}',
        description: 'Reroll under 3 once'
      }
    ]
  },
  '#{..}': {
    title: 'Count',
    description:
      'Count dice matching comparison conditions instead of summing values. More powerful than S{}/F{} sugar.',
    displayBase: '#{..}',
    forms: [
      {
        notation: '#{...}',
        note: 'Comma-separate multiple conditions'
      }
    ],
    comparisons: [
      { operator: '>=n', note: 'count dice showing n or more' },
      { operator: '>n', note: 'count dice showing more than n' },
      { operator: '<n', note: 'count dice showing less than n' },
      {
        operator: '<=n',
        note: 'count dice showing n or less'
      },
      { operator: '=n', note: 'count dice showing exactly n' }
    ],
    examples: [
      {
        notation: '5d10#{>=7}',
        description: 'Count dice >= 7'
      },
      {
        notation: '5d10#{>3,<1}',
        description: 'Count >3, deduct <1'
      }
    ]
  },
  'F{..}': {
    title: 'Count Failures',
    description:
      'Count dice at or below a threshold instead of summing values. Sugar for Count with lessThanOrEqual.',
    displayBase: 'F{..}',
    forms: [{ notation: 'F{N}', note: 'Count failures <= N' }],
    examples: [
      {
        notation: '5d10F{3}',
        description: 'Count dice <= 3'
      }
    ]
  },
  'ms{..}': {
    title: 'Margin of Success',
    description:
      'Subtract a target number from the total to get the margin of success or failure. Sugar for Minus N.',
    displayBase: 'ms{..}',
    forms: [
      {
        notation: 'ms{N}',
        note: 'Subtract N from total'
      }
    ],
    examples: [
      {
        notation: '1d20ms{15}',
        description: 'Margin of success vs DC 15'
      }
    ]
  },
  W: {
    title: 'Wild Die',
    description:
      'D6 System wild die: compound-explode on max, drop wild die and highest on 1, no effect otherwise. A macro that dispatches to multiple primitives based on runtime state.',
    displayBase: 'W',
    forms: [{ notation: 'W', note: 'Apply wild die rule' }],
    examples: [
      {
        notation: '5d6W',
        description: 'D6 System with wild die'
      }
    ]
  }
}
