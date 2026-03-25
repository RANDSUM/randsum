import type { ConformanceFile } from './types'

export const CONFORMANCE_FILE: ConformanceFile = {
  $id: 'https://notation.randsum.dev/conformance/v0.9.0.json',
  specVersion: '0.9.0',
  generatedFrom: 'apps/rdn/src/conformance/vectors.ts',
  conformanceLevels: {
    level1_core: [1, 2, 3, 10, 11, 14, 15, 16, 19, 20, 26, 27],
    level2_vtt: [
      1, 2, 3, 7, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 25, 26, 27, 35, 40, 43, 45
    ],
    level3_extended: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 25, 26, 27, 31,
      34, 35, 36, 37, 40, 41, 43, 44, 45
    ],
    level4_full: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 25, 26, 27, 31,
      32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45
    ],
    errorCases: [28, 29, 30, 46, 47, 48]
  },
  vectors: [
    {
      id: 1,
      notation: '1d20',
      category: 'dice_expressions',
      seedRolls: [14],
      expectedPool: [14],
      expectedTotal: 14,
      section: '4.1',
      conformanceLevel: 1
    },
    {
      id: 2,
      notation: 'd20',
      category: 'dice_expressions',
      seedRolls: [14],
      expectedPool: [14],
      expectedTotal: 14,
      section: '4.1',
      conformanceLevel: 1
    },
    {
      id: 3,
      notation: '3d6',
      category: 'dice_expressions',
      seedRolls: [3, 5, 2],
      expectedPool: [3, 5, 2],
      expectedTotal: 10,
      section: '4.1',
      conformanceLevel: 1
    },
    {
      id: 4,
      notation: 'd%',
      category: 'dice_expressions',
      seedRolls: [73],
      expectedPool: [73],
      expectedTotal: 73,
      section: '4.5.1',
      conformanceLevel: 3
    },
    {
      id: 5,
      notation: '4dF',
      category: 'dice_expressions',
      seedRolls: [-1, 0, 1, 1],
      expectedPool: [-1, 0, 1, 1],
      expectedTotal: 1,
      section: '4.5.2',
      conformanceLevel: 3
    },
    {
      id: 6,
      notation: '1dF.2',
      category: 'dice_expressions',
      seedRolls: [-2],
      expectedPool: [-2],
      expectedTotal: -2,
      section: '4.5.2',
      conformanceLevel: 3
    },
    {
      id: 7,
      notation: '4d6C{5}',
      category: 'stage1_modifiers',
      seedRolls: [6, 3, 5, 6],
      expectedPool: [5, 3, 5, 5],
      expectedTotal: 18,
      section: '6.4.2',
      conformanceLevel: 2
    },
    {
      id: 8,
      notation: '4d6V{1=6,3=5}',
      category: 'stage1_modifiers',
      seedRolls: [1, 3, 4, 1],
      expectedPool: [6, 5, 4, 6],
      expectedTotal: 21,
      section: '6.4.3',
      conformanceLevel: 3
    },
    {
      id: 9,
      notation: '4d6R{1}',
      category: 'stage2_modifiers',
      seedRolls: [1, 3, 5, 2],
      rerollRolls: [4],
      expectedPool: [4, 3, 5, 2],
      expectedTotal: 14,
      section: '6.5.2',
      conformanceLevel: 2
    },
    {
      id: 10,
      notation: '4d6L',
      category: 'stage2_modifiers',
      seedRolls: [3, 5, 2, 6],
      expectedPool: [3, 5, 6],
      expectedTotal: 14,
      section: '6.5.4',
      conformanceLevel: 1
    },
    {
      id: 11,
      notation: '4d6H',
      category: 'stage2_modifiers',
      seedRolls: [3, 5, 2, 6],
      expectedPool: [3, 5, 2],
      expectedTotal: 10,
      section: '6.5.4',
      conformanceLevel: 1
    },
    {
      id: 12,
      notation: '4d6!',
      category: 'stage2_modifiers',
      seedRolls: [6, 3, 5, 2],
      explodeRolls: [4],
      expectedPool: [6, 3, 5, 2, 4],
      expectedTotal: 20,
      section: '6.5.6',
      conformanceLevel: 2
    },
    {
      id: 13,
      notation: '4d6!',
      category: 'stage2_modifiers',
      seedRolls: [3, 4, 2, 5],
      expectedPool: [3, 4, 2, 5],
      expectedTotal: 14,
      section: '6.5.6',
      conformanceLevel: 2
    },
    {
      id: 14,
      notation: '2d6+5',
      category: 'stage3_modifiers',
      seedRolls: [3, 4],
      expectedPool: [3, 4],
      expectedTotal: 12,
      section: '6.6.4',
      conformanceLevel: 1
    },
    {
      id: 15,
      notation: '2d6-3',
      category: 'stage3_modifiers',
      seedRolls: [4, 5],
      expectedPool: [4, 5],
      expectedTotal: 6,
      section: '6.7.4',
      conformanceLevel: 1
    },
    {
      id: 16,
      notation: '2d6*3',
      category: 'stage3_modifiers',
      seedRolls: [2, 4],
      expectedPool: [2, 4],
      expectedTotal: 18,
      section: '6.6.3',
      conformanceLevel: 1
    },
    {
      id: 17,
      notation: '2d6//3',
      category: 'stage3_modifiers',
      seedRolls: [4, 5],
      expectedPool: [4, 5],
      expectedTotal: 3,
      section: '6.6.5',
      conformanceLevel: 3
    },
    {
      id: 18,
      notation: '5d10#{>=7}',
      category: 'stage3_modifiers',
      seedRolls: [8, 3, 10, 7, 2],
      expectedPool: [8, 3, 10, 7, 2],
      expectedTotal: 3,
      section: '6.6.2',
      conformanceLevel: 2
    },
    {
      id: 19,
      notation: '4d6K3',
      category: 'aliases',
      seedRolls: [2, 5, 3, 6],
      expectedPool: [5, 3, 6],
      expectedTotal: 14,
      section: '6.7.1',
      conformanceLevel: 1
    },
    {
      id: 20,
      notation: '4d6kl',
      category: 'aliases',
      seedRolls: [2, 5, 3, 6],
      expectedPool: [2],
      expectedTotal: 2,
      section: '6.7.1',
      conformanceLevel: 1
    },
    {
      id: 21,
      notation: '5d10S{7}',
      category: 'aliases',
      seedRolls: [8, 3, 10, 7, 2],
      expectedPool: [8, 3, 10, 7, 2],
      expectedTotal: 3,
      section: '6.7.7',
      conformanceLevel: 2
    },
    {
      id: 22,
      notation: '5d10F{3}',
      category: 'aliases',
      seedRolls: [8, 3, 10, 1, 2],
      expectedPool: [8, 3, 10, 1, 2],
      expectedTotal: 3,
      section: '6.7.8',
      conformanceLevel: 2
    },
    {
      id: 23,
      notation: '1d20ms{15}',
      category: 'aliases',
      seedRolls: [18],
      expectedPool: [18],
      expectedTotal: 3,
      section: '6.7.5',
      conformanceLevel: 3
    },
    {
      id: 24,
      notation: '4d6sa',
      category: 'non_modifier_features',
      seedRolls: [3, 1, 5, 2],
      expectedPool: [1, 2, 3, 5],
      expectedTotal: 11,
      section: '6.8.1',
      conformanceLevel: 2
    },
    {
      id: 25,
      notation: '2d6+3[fire]',
      category: 'non_modifier_features',
      seedRolls: [4, 5],
      expectedPool: [4, 5],
      expectedTotal: 12,
      section: '6.8.2',
      conformanceLevel: 2
    },
    {
      id: 26,
      notation: '2D6',
      category: 'case_insensitivity',
      seedRolls: [3, 4],
      expectedPool: [3, 4],
      expectedTotal: 7,
      section: '8.1',
      conformanceLevel: 1
    },
    {
      id: 27,
      notation: '4D6l',
      category: 'case_insensitivity',
      seedRolls: [3, 5, 2, 6],
      expectedPool: [3, 5, 6],
      expectedTotal: 14,
      section: '8.1',
      conformanceLevel: 1
    },
    {
      id: 28,
      notation: '4d',
      category: 'error_cases',
      expectedError: true,
      section: '9.5',
      conformanceLevel: 1
    },
    {
      id: 29,
      notation: 'd',
      category: 'error_cases',
      expectedError: true,
      section: '9.5',
      conformanceLevel: 1
    },
    {
      id: 30,
      notation: 'd0',
      category: 'error_cases',
      expectedError: true,
      section: '9.5',
      conformanceLevel: 1
    },
    {
      id: 31,
      notation: '2d{fire,ice,lightning}',
      category: 'extended_coverage',
      seedRolls: [2, 1],
      expectedPool: ['ice', 'fire'],
      expectedTotal: null,
      section: '4.2',
      conformanceLevel: 3,
      note: 'Face indices: 1=fire, 2=ice, 3=lightning. Roll values map to face labels.'
    },
    {
      id: 32,
      notation: 'g6',
      category: 'extended_coverage',
      seedRolls: [6, 6, 3],
      expectedPool: [6, 6, 3],
      expectedTotal: 15,
      section: '4.3',
      conformanceLevel: 4
    },
    {
      id: 33,
      notation: '3DD6',
      category: 'extended_coverage',
      seedRolls: [4, 1, 6],
      expectedPool: [4, 1, 6],
      expectedTotal: 11,
      section: '4.4',
      conformanceLevel: 4
    },
    {
      id: 34,
      notation: 'z6',
      category: 'extended_coverage',
      seedRolls: [0],
      expectedPool: [0],
      expectedTotal: 0,
      section: '4.5.3',
      conformanceLevel: 3
    },
    {
      id: 35,
      notation: '3d6U',
      category: 'extended_coverage',
      seedRolls: [3, 3, 5],
      rerollRolls: [4],
      expectedPool: [3, 4, 5],
      expectedTotal: 12,
      section: '6.5.3',
      conformanceLevel: 2
    },
    {
      id: 36,
      notation: '2d6!!',
      category: 'extended_coverage',
      seedRolls: [6, 3],
      compoundRolls: [4],
      expectedPool: [10, 3],
      expectedTotal: 13,
      section: '6.5.8',
      conformanceLevel: 3
    },
    {
      id: 37,
      notation: '2d6!p',
      category: 'extended_coverage',
      seedRolls: [6, 3],
      penetrateRolls: [3],
      expectedPool: [8, 3],
      expectedTotal: 11,
      section: '6.5.9',
      conformanceLevel: 3
    },
    {
      id: 38,
      notation: '5d6W',
      category: 'extended_coverage',
      seedRolls: [6, 3, 4, 2, 5],
      expectedPool: [6, 3, 4, 2, 5],
      expectedTotal: 20,
      section: '6.5.10',
      conformanceLevel: 4
    },
    {
      id: 39,
      notation: '3d6!s{4,6,8}',
      category: 'extended_coverage',
      seedRolls: [4, 2, 5],
      sequenceRolls: [6],
      expectedPool: [4, 2, 5, 6],
      expectedTotal: 17,
      section: '6.5.7',
      conformanceLevel: 4
    },
    {
      id: 40,
      notation: '2d6%4',
      category: 'extended_coverage',
      seedRolls: [3, 5],
      expectedPool: [3, 5],
      expectedTotal: 0,
      section: '6.6.6',
      conformanceLevel: 2
    },
    {
      id: 41,
      notation: '2d6**2',
      category: 'extended_coverage',
      seedRolls: [3, 4],
      expectedPool: [3, 4],
      expectedTotal: 14,
      section: '6.7.6',
      conformanceLevel: 3
    },
    {
      id: 42,
      notation: '4d6C{5}L!+2',
      category: 'extended_coverage',
      seedRolls: [6, 1, 5, 6],
      expectedPool: null,
      expectedTotal: null,
      section: '6.9',
      conformanceLevel: 4,
      note: 'Complex multi-modifier chain. Exact pool depends on priority resolution; see Section 6.9.'
    },
    {
      id: 43,
      notation: '4d6ro{1}',
      category: 'extended_coverage',
      seedRolls: [1, 3, 5, 4],
      rerollRolls: [2],
      expectedPool: [2, 3, 5, 4],
      expectedTotal: 14,
      section: '6.7.3',
      conformanceLevel: 2
    },
    {
      id: 44,
      notation: '6d6KM',
      category: 'extended_coverage',
      seedRolls: [1, 4, 3, 5, 2, 6],
      expectedPool: [4, 3, 5, 2],
      expectedTotal: 14,
      section: '6.7.2',
      conformanceLevel: 3
    },
    {
      id: 45,
      notation: '5d10#{>=7,<=2}',
      category: 'extended_coverage',
      seedRolls: [8, 1, 10, 7, 2],
      expectedPool: [8, 1, 10, 7, 2],
      expectedTotal: 1,
      section: '6.6.2',
      conformanceLevel: 2
    },
    {
      id: 46,
      notation: '0d6',
      category: 'error_cases',
      expectedError: true,
      section: '9.5',
      conformanceLevel: 1
    },
    {
      id: 47,
      notation: '5d10S{7}F{3}',
      category: 'error_cases',
      expectedError: true,
      errorDescription: 'Multiple Count modifiers are not permitted',
      section: '6.9',
      conformanceLevel: 1
    },
    {
      id: 48,
      notation: '4d6 L',
      category: 'error_cases',
      expectedError: true,
      errorDescription: 'Whitespace between tokens is not permitted',
      section: '8.2',
      conformanceLevel: 1
    }
  ]
} as const
