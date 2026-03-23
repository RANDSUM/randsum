import type { NotationDoc } from './modifierDocs'

/**
 * All modifier documentation entries, collected here so they are
 * tree-shakeable from the main roller bundle.
 *
 * This file is the sole source of modifier docs data.
 * It is NOT imported by any modifier file or by the core roller path.
 */
export const MODIFIER_DOC_ENTRIES: readonly NotationDoc[] = [
  // cap
  {
    key: 'C{..}',
    category: 'Clamp',
    color: '#67e8f9',
    colorLight: '#0891b2',
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
        description: 'Cap rolls: nothing exceeds 5',
        notation: '4d6C{>5}',
        options: { sides: 6, quantity: 4, modifiers: { cap: { greaterThan: 5 } } }
      },
      {
        description: 'Clamp rolls to [3, 18]',
        notation: '4d20C{<3,>18}',
        options: {
          sides: 20,
          quantity: 4,
          modifiers: { cap: { lessThan: 3, greaterThan: 18 } }
        }
      }
    ]
  },
  // replace
  {
    key: 'V{..}',
    category: 'Map',
    color: '#2dd4bf',
    colorLight: '#0d9488',
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
      {
        description: 'Replace 1s with 2',
        notation: '4d6V{1=2}',
        options: { sides: 6, quantity: 4, modifiers: { replace: { from: 1, to: 2 } } }
      },
      {
        description: 'Cap 19s and 20s to 20',
        notation: '4d20V{>18=20}',
        options: {
          sides: 20,
          quantity: 4,
          modifiers: { replace: { from: { greaterThan: 18 }, to: 20 } }
        }
      },
      {
        description: 'Replace multiple',
        notation: '4d6V{1=2,6=5}',
        options: {
          sides: 6,
          quantity: 4,
          modifiers: {
            replace: [
              { from: 1, to: 2 },
              { from: 6, to: 5 }
            ]
          }
        }
      }
    ]
  },
  // reroll
  {
    key: 'R{..}',
    category: 'Substitute',
    color: '#f472b6',
    colorLight: '#db2777',
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
      {
        description: 'Reroll any 1s',
        notation: '4d6R{1}',
        options: { sides: 6, quantity: 4, modifiers: { reroll: { exact: [1] } } }
      },
      {
        description: 'Reroll results under 3',
        notation: '2d10R{<3}',
        options: { sides: 10, quantity: 2, modifiers: { reroll: { lessThan: 3 } } }
      },
      {
        description: 'Reroll under 3, max 2 attempts',
        notation: '4d6R{<3}2',
        options: { sides: 6, quantity: 4, modifiers: { reroll: { lessThan: 3, max: 2 } } }
      }
    ]
  },
  {
    key: 'ro{..}',
    category: 'Substitute',
    color: '#f472b6',
    colorLight: '#db2777',
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
      {
        description: 'Reroll 1s once',
        notation: '4d6ro{1}',
        options: { sides: 6, quantity: 4, modifiers: { reroll: { exact: [1], max: 1 } } }
      },
      {
        description: 'Reroll under 3 once',
        notation: '2d10ro{<3}',
        options: { sides: 10, quantity: 2, modifiers: { reroll: { lessThan: 3, max: 1 } } }
      }
    ]
  },
  // explode
  {
    key: '!',
    category: 'Generate',
    color: '#fbbf24',
    colorLight: '#d97706',
    title: 'Explode',
    description:
      'Each die showing its maximum value triggers an extra die roll. Continues if new dice also max.',
    displayBase: '!',
    forms: [
      { notation: '!', note: 'Explode on max value' },
      { notation: '!{condition}', note: 'Explode on condition match' }
    ],
    comparisons: [
      { operator: 'n', note: 'explode on exactly n' },
      { operator: '>n', note: 'explode on more than n' },
      { operator: '>=n', note: 'explode on n or more' },
      { operator: '<n', note: 'explode on less than n' },
      { operator: '<=n', note: 'explode on n or less' }
    ],
    examples: [
      {
        description: 'Roll 3d6; any 6 adds another d6',
        notation: '3d6!',
        options: { sides: 6, quantity: 3, modifiers: { explode: true } }
      },
      { description: 'Roll 4d6, explode, then drop lowest', notation: '4d6L!' },
      {
        description: 'Roll 3d10; explode on 8 or higher',
        notation: '3d10!{>=8}',
        options: { sides: 10, quantity: 3, modifiers: { explode: { greaterThanOrEqual: 8 } } }
      },
      { description: 'Roll 5d10; explode only on 10', notation: '5d10!{=10}' }
    ]
  },
  // compound
  {
    key: '!!',
    category: 'Accumulate',
    color: '#f59e0b',
    colorLight: '#b45309',
    title: 'Compound Explode',
    description:
      'Like explode, but extra rolls add to the triggering die rather than creating new dice.',
    displayBase: '!!',
    displayOptional: 'n',
    forms: [
      { notation: '!!(n)', note: 'Compound up to n times (default: once)' },
      { notation: '!!0', note: 'Unlimited depth (capped at 100)' },
      { notation: '!!{condition}', note: 'Compound on condition match' }
    ],
    comparisons: [
      { operator: 'n', note: 'compound on exactly n' },
      { operator: '>n', note: 'compound on more than n' },
      { operator: '>=n', note: 'compound on n or more' },
      { operator: '<n', note: 'compound on less than n' },
      { operator: '<=n', note: 'compound on n or less' }
    ],
    examples: [
      {
        description: 'Roll 3d6; 6s add to themselves',
        notation: '3d6!!',
        options: { sides: 6, quantity: 3, modifiers: { compound: true } }
      },
      { description: 'Roll 1d8, compound up to 5 times', notation: '1d8!!5' },
      {
        description: 'Roll 5d10; compound on 8 or higher',
        notation: '5d10!!{>=8}',
        options: { sides: 10, quantity: 5, modifiers: { compound: { greaterThanOrEqual: 8 } } }
      }
    ]
  },
  // penetrate
  {
    key: '!p',
    category: 'Accumulate',
    color: '#d97706',
    colorLight: '#92400e',
    title: 'Penetrating Explode',
    description:
      'Like explode, but each subsequent explosion subtracts 1 from the result (Hackmaster-style).',
    displayBase: '!p',
    displayOptional: 'n',
    forms: [
      { notation: '!p(n)', note: 'Penetrate up to n times (default: once)' },
      { notation: '!p0', note: 'Unlimited depth (capped at 100)' },
      { notation: '!p{condition}', note: 'Penetrate on condition match' }
    ],
    comparisons: [
      { operator: 'n', note: 'penetrate on exactly n' },
      { operator: '>n', note: 'penetrate on more than n' },
      { operator: '>=n', note: 'penetrate on n or more' },
      { operator: '<n', note: 'penetrate on less than n' },
      { operator: '<=n', note: 'penetrate on n or less' }
    ],
    examples: [
      {
        description: 'Roll 1d6; max penetrates with -1 per chain',
        notation: '1d6!p',
        options: { sides: 6, modifiers: { penetrate: true } }
      },
      { description: 'Penetrate, then drop lowest', notation: '2d6!pL' },
      {
        description: 'Roll 5d10; penetrate on 8 or higher',
        notation: '5d10!p{>=8}',
        options: { sides: 10, quantity: 5, modifiers: { penetrate: { greaterThanOrEqual: 8 } } }
      }
    ]
  },
  // explodeSequence
  {
    key: '!s{..}',
    category: 'Generate',
    color: '#fcd34d',
    colorLight: '#ca8a04',
    title: 'Explode Sequence',
    description:
      'On max, re-roll with the next die size in a custom sequence rather than reusing the same die.',
    displayBase: '!s{..}',
    forms: [{ notation: '!s{N1,N2,...}', note: 'Step through die sizes on each explosion' }],
    examples: [
      {
        description: 'Explode through d4, d6, d8, d10',
        notation: '1d4!s{4,6,8,10}',
        options: { sides: 4, modifiers: { explodeSequence: [4, 6, 8, 10] } }
      },
      {
        description: 'Explode to d8, then d12',
        notation: '1d6!s{8,12}',
        options: { sides: 6, modifiers: { explodeSequence: [8, 12] } }
      }
    ]
  },
  {
    key: '!i',
    category: 'Generate',
    color: '#fcd34d',
    colorLight: '#ca8a04',
    title: 'Inflation',
    description:
      'Explode upward through the TTRPG standard die set (4, 6, 8, 10, 12, 20, 100). Sugar for Explode Sequence going up.',
    displayBase: '!i',
    forms: [{ notation: '!i', note: 'Inflate through standard dice sizes' }],
    examples: [
      {
        description: 'Explode d4 through d6, d8, d10, d12, d20',
        notation: '1d4!i',
        options: { sides: 4, modifiers: { explodeSequence: [6, 8, 10, 12, 20] } }
      }
    ]
  },
  {
    key: '!r',
    category: 'Generate',
    color: '#fcd34d',
    colorLight: '#ca8a04',
    title: 'Reduction',
    description:
      'Explode downward through the TTRPG standard die set (4, 6, 8, 10, 12, 20, 100). Sugar for Explode Sequence going down.',
    displayBase: '!r',
    forms: [{ notation: '!r', note: 'Reduce through standard dice sizes' }],
    examples: [
      {
        description: 'Explode d20 through d12, d10, d8, d6, d4',
        notation: '1d20!r',
        options: { sides: 20, modifiers: { explodeSequence: [12, 10, 8, 6, 4] } }
      }
    ]
  },
  // wildDie
  {
    key: 'W',
    category: 'Dispatch',
    color: '#facc15',
    colorLight: '#a16207',
    title: 'Wild Die',
    description:
      'D6 System wild die: compound-explode on max, drop wild die and highest on 1, no effect otherwise. A macro that dispatches to multiple primitives based on runtime state.',
    displayBase: 'W',
    forms: [{ notation: 'W', note: 'Apply wild die rule' }],
    examples: [
      {
        description: 'D6 System with wild die',
        notation: '5d6W',
        options: { sides: 6, quantity: 5, modifiers: { wildDie: true } }
      }
    ]
  },
  // unique
  {
    key: 'U',
    category: 'Substitute',
    color: '#5eead4',
    colorLight: '#0f766e',
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
        description: 'Roll 4d20, no duplicate results',
        notation: '4d20U',
        options: { sides: 20, quantity: 4, modifiers: { unique: true } }
      },
      {
        description: 'Unique except 1s may repeat',
        notation: '4d6U{1}',
        options: { sides: 6, quantity: 4, modifiers: { unique: { notUnique: [1] } } }
      }
    ]
  },
  // drop
  {
    key: 'L',
    category: 'Filter',
    color: '#fb7185',
    colorLight: '#e11d48',
    title: 'Drop Lowest',
    description: 'Remove the lowest-valued dice from the pool before summing.',
    displayBase: 'L',
    displayOptional: 'n',
    forms: [{ notation: 'L(n)', note: 'Drop n lowest (default: 1)' }],
    examples: [
      {
        description: 'Roll 4d6, drop lowest (ability scores)',
        notation: '4d6L',
        options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }
      },
      {
        description: 'Roll 5d6, drop 2 lowest',
        notation: '5d6L2',
        options: { sides: 6, quantity: 5, modifiers: { drop: { lowest: 2 } } }
      }
    ]
  },
  {
    key: 'H',
    category: 'Filter',
    color: '#fb7185',
    colorLight: '#e11d48',
    title: 'Drop Highest',
    description: 'Remove the highest-valued dice from the pool before summing.',
    displayBase: 'H',
    displayOptional: 'n',
    forms: [{ notation: 'H(n)', note: 'Drop n highest (default: 1)' }],
    examples: [
      {
        description: 'Roll 2d20, drop highest (disadvantage)',
        notation: '2d20H',
        options: { sides: 20, quantity: 2, modifiers: { drop: { highest: 1 } } }
      },
      {
        description: 'Roll 4d6, drop highest',
        notation: '4d6H',
        options: { sides: 6, quantity: 4, modifiers: { drop: { highest: 1 } } }
      }
    ]
  },
  {
    key: 'D{..}',
    category: 'Filter',
    color: '#e11d48',
    colorLight: '#9f1239',
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
      {
        description: 'Drop all 1s',
        notation: '4d6D{1}',
        options: { sides: 6, quantity: 4, modifiers: { drop: { exact: [1] } } }
      },
      {
        description: 'Drop all 5s and above',
        notation: '4d6D{>=5}',
        options: { sides: 6, quantity: 4, modifiers: { drop: { greaterThanOrEqual: 5 } } }
      },
      {
        description: 'Drop any result of 2 or lower',
        notation: '4d6D{<=2}'
      },
      { description: 'Drop multiple', notation: '4d6D{1,6}' }
    ]
  },
  // keep
  {
    key: 'K',
    category: 'Filter',
    color: '#fb923c',
    colorLight: '#c2410c',
    title: 'Keep Highest',
    description: 'Keep only the n highest-valued dice; discard the rest.',
    displayBase: 'K',
    displayOptional: 'n',
    forms: [{ notation: 'K(n)', note: 'Keep n highest (default: 1)' }],
    examples: [
      {
        description: 'Roll 2d20, keep highest (advantage)',
        notation: '2d20K',
        options: { sides: 20, quantity: 2, modifiers: { keep: { highest: 1 } } }
      },
      {
        description: 'Roll 4d6, keep highest 3',
        notation: '4d6K3',
        options: { sides: 6, quantity: 4, modifiers: { keep: { highest: 3 } } }
      }
    ]
  },
  {
    key: 'KL',
    category: 'Filter',
    color: '#f97316',
    colorLight: '#9a3412',
    title: 'Keep Lowest',
    description: 'Keep only the n lowest-valued dice; discard the rest.',
    displayBase: 'KL',
    displayOptional: 'n',
    forms: [{ notation: 'KL(n)', note: 'Keep n lowest (default: 1)' }],
    examples: [
      {
        description: 'Roll 2d20, keep lowest (disadvantage)',
        notation: '2d20KL',
        options: { sides: 20, quantity: 2, modifiers: { keep: { lowest: 1 } } }
      },
      {
        description: 'Roll 4d6, keep 2 lowest',
        notation: '4d6KL2',
        options: { sides: 6, quantity: 4, modifiers: { keep: { lowest: 2 } } }
      }
    ]
  },
  {
    key: 'KM',
    category: 'Filter',
    color: '#fdba74',
    colorLight: '#ea580c',
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
        description: 'Keep 3 middle dice',
        notation: '5d6KM3'
      },
      {
        description: 'Keep middle 2',
        notation: '4d6KM',
        options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1, highest: 1 } } }
      }
    ]
  },
  // count
  {
    key: '#{..}',
    category: 'Reinterpret',
    color: '#60a5fa',
    colorLight: '#2563eb',
    title: 'Count',
    description:
      'Count dice matching comparison conditions instead of summing values. More powerful than S{}/F{} sugar.',
    displayBase: '#{..}',
    comparisons: [
      { operator: '>=n', note: 'count dice showing n or more' },
      { operator: '>n', note: 'count dice showing more than n' },
      { operator: '<n', note: 'count dice showing less than n' },
      { operator: '<=n', note: 'count dice showing n or less' },
      { operator: '=n', note: 'count dice showing exactly n' }
    ],
    forms: [{ notation: '#{...}', note: 'Comma-separate multiple conditions' }],
    examples: [
      {
        description: 'Count dice >= 7',
        notation: '5d10#{>=7}',
        options: { sides: 10, quantity: 5, modifiers: { count: { greaterThanOrEqual: 7 } } }
      },
      {
        description: 'Count >3, deduct <1',
        notation: '5d10#{>3,<1}',
        options: {
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThan: 3, lessThan: 1, deduct: true } }
        }
      }
    ]
  },
  {
    key: 'S{..}',
    category: 'Reinterpret',
    color: '#3b82f6',
    colorLight: '#1d4ed8',
    title: 'Count Successes',
    description:
      'Count dice that meet a threshold instead of summing values \u2014 used in dice pool systems.',
    displayBase: 'S{..}',
    forms: [
      { notation: 'S{n}', note: 'Single success threshold' },
      { notation: 'S{n,b}', note: 'Threshold + botch threshold' }
    ],
    examples: [
      {
        description: 'Count dice that rolled 7 or higher',
        notation: '5d10S{7}',
        options: { sides: 10, quantity: 5, modifiers: { count: { greaterThanOrEqual: 7 } } }
      },
      {
        description: 'Successes \u2265 7, subtract botches \u2264 1',
        notation: '5d10S{7,1}',
        options: {
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true } }
        }
      }
    ]
  },
  {
    key: 'F{..}',
    category: 'Reinterpret',
    color: '#93c5fd',
    colorLight: '#3b82f6',
    title: 'Count Failures',
    description:
      'Count dice at or below a threshold instead of summing values. Sugar for Count with lessThanOrEqual.',
    displayBase: 'F{..}',
    forms: [{ notation: 'F{N}', note: 'Count failures <= N' }],
    examples: [
      {
        description: 'Count dice <= 3',
        notation: '5d10F{3}',
        options: { sides: 10, quantity: 5, modifiers: { count: { lessThanOrEqual: 3 } } }
      }
    ]
  },
  {
    key: 'ms{..}',
    category: 'Scale',
    color: '#6366f1',
    colorLight: '#4338ca',
    title: 'Margin of Success',
    description:
      'Subtract a target number from the total to get the margin of success or failure. Sugar for Minus N.',
    displayBase: 'ms{..}',
    forms: [{ notation: 'ms{N}', note: 'Subtract N from total' }],
    examples: [
      {
        description: 'Margin of success vs DC 15',
        notation: '1d20ms{15}',
        options: { sides: 20, modifiers: { minus: 15 } }
      }
    ]
  },
  // multiply
  {
    key: '*',
    category: 'Scale',
    color: '#a3e635',
    colorLight: '#4d7c0f',
    title: 'Multiply Dice',
    description: 'Multiply the dice sum before applying +/\u2212 arithmetic modifiers.',
    displayBase: '*',
    displayOptional: 'n',
    forms: [{ notation: '*n', note: 'Multiply dice sum by n (pre-arithmetic)' }],
    examples: [
      { description: '(roll \u00d7 2) + 3', notation: '2d6*2+3' },
      {
        description: 'Triple the dice sum',
        notation: '4d6*3',
        options: { sides: 6, quantity: 4, modifiers: { multiply: 3 } }
      }
    ]
  },
  // plus
  {
    key: '+',
    category: 'Scale',
    color: '#4ade80',
    colorLight: '#16a34a',
    title: 'Add',
    description: 'Add a fixed number to the total after all dice are rolled.',
    displayBase: '+',
    displayOptional: 'n',
    forms: [{ notation: '+n', note: 'Add n to total' }],
    examples: [
      {
        description: 'Roll 1d20, add 5',
        notation: '1d20+5',
        options: { sides: 20, modifiers: { plus: 5 } }
      },
      {
        description: 'Roll 2d6, add 3',
        notation: '2d6+3',
        options: { sides: 6, quantity: 2, modifiers: { plus: 3 } }
      }
    ]
  },
  // minus
  {
    key: '-',
    category: 'Scale',
    color: '#f87171',
    colorLight: '#dc2626',
    title: 'Subtract',
    description: 'Subtract a fixed number from the total after all dice are rolled.',
    displayBase: '\u2212',
    displayOptional: 'n',
    forms: [{ notation: '-n', note: 'Subtract n from total' }],
    examples: [
      {
        description: 'Roll 1d20, subtract 2',
        notation: '1d20-2',
        options: { sides: 20, modifiers: { minus: 2 } }
      },
      {
        description: 'Drop lowest, subtract 1',
        notation: '4d6L-1',
        options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 }, minus: 1 } }
      }
    ]
  },
  // integerDivide
  {
    key: '//',
    category: 'Scale',
    color: '#34d399',
    colorLight: '#059669',
    title: 'Integer Divide',
    description: 'Divide the total by a number and round down (floor division).',
    displayBase: '//',
    displayOptional: 'n',
    forms: [{ notation: '//n', note: 'Divide total by n, round down' }],
    examples: [
      {
        description: 'Roll 2d6, halve (round down)',
        notation: '2d6//2',
        options: { sides: 6, quantity: 2, modifiers: { integerDivide: 2 } }
      },
      {
        description: 'Drop lowest, then divide by 3',
        notation: '4d6L//3',
        options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 }, integerDivide: 3 } }
      }
    ]
  },
  // modulo
  {
    key: '%',
    category: 'Scale',
    color: '#10b981',
    colorLight: '#047857',
    title: 'Modulo',
    description: 'Take the remainder after dividing the total by a number.',
    displayBase: '%',
    displayOptional: 'n',
    forms: [{ notation: '%n', note: 'Total modulo n' }],
    examples: [
      {
        description: 'Roll 1d20, result mod 5',
        notation: '1d20%5',
        options: { sides: 20, modifiers: { modulo: 5 } }
      },
      {
        description: 'Roll 2d6, remainder after dividing by 3',
        notation: '2d6%3',
        options: { sides: 6, quantity: 2, modifiers: { modulo: 3 } }
      }
    ]
  },
  // sort
  {
    key: 'sort',
    category: 'Order',
    color: '#94a3b8',
    colorLight: '#475569',
    title: 'Sort',
    description:
      'Sort the dice pool in ascending or descending order. Does not affect the total \u2014 only the presentation order of dice.',
    displayBase: 'sa',
    displayOptional: '/sd',
    forms: [
      { notation: 'sa', note: 'Sort ascending' },
      { notation: 'sd', note: 'Sort descending' }
    ],
    examples: [
      {
        description: 'Roll 4d6, display sorted low to high',
        notation: '4d6sa',
        options: { sides: 6, quantity: 4, modifiers: { sort: 'asc' } }
      },
      {
        description: 'Roll 4d6, display sorted high to low',
        notation: '4d6sd',
        options: { sides: 6, quantity: 4, modifiers: { sort: 'desc' } }
      }
    ]
  },
  // multiplyTotal
  {
    key: '**',
    category: 'Scale',
    color: '#84cc16',
    colorLight: '#3f6212',
    title: 'Multiply Total',
    description: 'Multiply the entire final total after all other modifiers have been applied.',
    displayBase: '**',
    displayOptional: 'n',
    forms: [{ notation: '**n', note: 'Multiply final total by n' }],
    examples: [
      {
        description: '(roll + 3) \u00d7 2',
        notation: '2d6+3**2',
        options: { sides: 6, quantity: 2, modifiers: { plus: 3, multiplyTotal: 2 } }
      },
      {
        description: '(drop-lowest sum) \u00d7 3',
        notation: '4d6L**3',
        options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 }, multiplyTotal: 3 } }
      }
    ]
  }
]
