/**
 * Public API surface guarantees for the main barrel (`@randsum/roller`).
 *
 * Verifies:
 * - The documented public exports are importable and callable from the barrel.
 * - Internal helpers pruned in the dead-code audit are NOT re-exported from the
 *   barrel (they remain internal modules, imported directly by src where needed).
 */
import { describe, expect, test } from 'bun:test'
import * as roller from '../src/index'

describe('main barrel public surface', () => {
  describe('documented public exports are accessible', () => {
    test('roll is a callable function', () => {
      expect(typeof roller.roll).toBe('function')
    })

    test('notation() is a callable function', () => {
      expect(typeof roller.notation).toBe('function')
      expect(roller.notation('4d6')).toBe('4d6')
      expect(() => roller.notation('not-dice')).toThrow()
    })

    test('notation conversion helpers are callable', () => {
      expect(typeof roller.notationToOptions).toBe('function')
      expect(typeof roller.optionsToNotation).toBe('function')
      expect(typeof roller.optionsToDescription).toBe('function')
      expect(typeof roller.modifiersToNotation).toBe('function')
      expect(typeof roller.modifiersToDescription).toBe('function')
    })

    test('validation + suggestion helpers are callable', () => {
      expect(typeof roller.validateNotation).toBe('function')
      expect(typeof roller.isDiceNotation).toBe('function')
      expect(typeof roller.suggestNotationFix).toBe('function')
      expect(typeof roller.tokenize).toBe('function')
    })
  })

  describe('pruned internals are not re-exported from the barrel', () => {
    const removed = [
      'optionsToSidesFaces',
      'listOfNotations',
      'coreNotationPattern',
      'formatHumanList',
      'TTRPG_STANDARD_DIE_SET',
      'parseComparisonNotation',
      'hasConditions',
      'formatComparisonNotation',
      'formatComparisonDescription'
    ] as const

    for (const name of removed) {
      test(`${name} is not exported from the barrel`, () => {
        expect(name in roller).toBe(false)
      })
    }
  })
})
