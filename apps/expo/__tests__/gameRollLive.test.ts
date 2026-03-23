import { describe, expect, test } from 'bun:test'

import { roll as rollBlades } from '@randsum/games/blades'
import { roll as rollDaggerheart } from '@randsum/games/daggerheart'
import { roll as rollFifth } from '@randsum/games/fifth'
import { roll as rollPbta } from '@randsum/games/pbta'
import { roll as rollRootRpg } from '@randsum/games/root-rpg'
import { roll as rollSalvageunion } from '@randsum/games/salvageunion'

describe('Game roll live imports', () => {
  test('blades — roll with rating 2 produces valid result', () => {
    const result = rollBlades({ rating: 2 })
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(6)
    expect(typeof result.result).toBe('string')
    expect(['critical', 'success', 'partial', 'failure']).toContain(result.result)
    expect(result.rolls.length).toBeGreaterThan(0)
  })

  test('blades — desperate (rating 0) produces valid result', () => {
    const result = rollBlades({ rating: 0 })
    expect(typeof result.result).toBe('string')
    expect(['success', 'partial', 'failure']).toContain(result.result)
  })

  test('fifth — roll with default inputs produces valid result', () => {
    const result = rollFifth()
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(typeof result.result).toBe('number')
    expect(result.rolls.length).toBeGreaterThan(0)
  })

  test('fifth — roll with advantage produces valid result', () => {
    const result = rollFifth({ rollingWith: 'Advantage', modifier: 3, crit: true })
    expect(typeof result.result).toBe('number')
    expect(result.details.criticals).toBeDefined()
  })

  test('daggerheart — roll with defaults produces valid result', () => {
    const result = rollDaggerheart()
    expect(typeof result.total).toBe('number')
    expect(typeof result.result).toBe('string')
    expect(['hope', 'fear', 'critical hope']).toContain(result.result)
    expect(result.rolls.length).toBeGreaterThan(0)
  })

  test('pbta — roll with stat produces valid result', () => {
    const result = rollPbta({ stat: 2 })
    expect(typeof result.total).toBe('number')
    expect(typeof result.result).toBe('string')
    expect(['strong_hit', 'weak_hit', 'miss']).toContain(result.result)
    expect(result.rolls.length).toBeGreaterThan(0)
  })

  test('root-rpg — roll with bonus produces valid result', () => {
    const result = rollRootRpg({ bonus: 1 })
    expect(typeof result.total).toBe('number')
    expect(typeof result.result).toBe('string')
    expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result.result)
    expect(result.rolls.length).toBeGreaterThan(0)
  })

  test('salvageunion — roll with Core Mechanic table produces valid result', () => {
    const result = rollSalvageunion({ tableName: 'Core Mechanic' })
    expect(typeof result.total).toBe('number')
    expect(result.result).toBeDefined()
    expect(result.rolls.length).toBeGreaterThan(0)
  })
})
