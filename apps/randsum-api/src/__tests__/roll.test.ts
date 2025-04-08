import { RollResult } from '@randsum/dice'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { handleRollRequest } from '../routes/roll'

describe('Roll Endpoint', () => {
  const originalRandom = Math.random

  beforeEach(() => {
    let counter = 0
    const mockValues = [0.2, 0.5, 0.8, 0.3, 0.6]

    Math.random = () => mockValues[counter++ % mockValues.length]
  })

  afterEach(() => {
    Math.random = originalRandom
  })

  it('should handle basic roll with no parameters', async () => {
    const request = new Request('http://localhost:3000/roll')
    const response = handleRollRequest(request)
    const data = (await response.json()) as RollResult

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('dicePools')
    expect(data).toHaveProperty('rawRolls')
    expect(data).toHaveProperty('modifiedRolls')
    expect(data).toHaveProperty('rawResult')
    expect(data).toHaveProperty('result')
    expect(data).toHaveProperty('type')
    expect(data).toHaveProperty('total')

    const poolKey: keyof typeof data.dicePools = Object.keys(data.dicePools)[0]
    expect(data.dicePools[poolKey].notation).toBe('1d20')
    expect(data.type).toBe('numerical')
  })

  it('should handle roll with notation parameter', async () => {
    const request = new Request('http://localhost:3000/roll?notation=2d6')
    const response = handleRollRequest(request)
    const data = (await response.json()) as RollResult

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('dicePools')
    expect(data).toHaveProperty('result')

    const poolKey: keyof typeof data.dicePools = Object.keys(data.dicePools)[0]
    expect(data.dicePools[poolKey].notation).toBe('2d6')
    expect(data.dicePools[poolKey].options.quantity).toBe(2)
    expect(data.dicePools[poolKey].options.sides).toBe(6)
  })

  it('should handle roll with complex notation', async () => {
    const request = new Request('http://localhost:3000/roll?notation=4d6L')
    const response = handleRollRequest(request)
    const data = (await response.json()) as RollResult

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('dicePools')

    const poolKey: keyof typeof data.dicePools = Object.keys(data.dicePools)[0]
    expect(data.dicePools[poolKey].notation).toBe('4d6L')
    expect(data.dicePools[poolKey].options.quantity).toBe(4)
    expect(data.dicePools[poolKey].options.sides).toBe(6)
    expect(data.dicePools[poolKey].options.modifiers).toHaveProperty('drop')
  })

  it('should return error for invalid notation', async () => {
    const request = new Request('http://localhost:3000/roll?notation=invalid')
    const response = handleRollRequest(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Invalid dice notation')
  })

  it('should include roll results in the response', async () => {
    const request = new Request('http://localhost:3000/roll?notation=2d20')
    const response = handleRollRequest(request)
    const data = (await response.json()) as RollResult

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('rawResult')
    expect(data).toHaveProperty('result')
    expect(data).toHaveProperty('total')

    expect(Array.isArray(data.rawResult)).toBe(true)
    expect(Array.isArray(data.result)).toBe(true)
    expect(typeof data.total).toBe('number')
    expect(data.rawResult.length).toBe(2) // 2d20 should have 2 results
  })

  it('should include detailed dice information', async () => {
    const request = new Request('http://localhost:3000/roll?notation=1d20')
    const response = handleRollRequest(request)
    const data = (await response.json()) as RollResult

    expect(response.status).toBe(200)

    const poolKey: keyof typeof data.dicePools = Object.keys(data.dicePools)[0]
    expect(data.dicePools[poolKey].die).toHaveProperty('sides')
    expect(data.dicePools[poolKey].die).toHaveProperty('faces')
    expect(data.dicePools[poolKey].die).toHaveProperty('type')
    expect(data.dicePools[poolKey].die.sides).toBe(20)
    expect((data.dicePools[poolKey].die.faces as number[]).length).toBe(20)
    expect(data.dicePools[poolKey].die.type).toBe('numerical')
  })
})
