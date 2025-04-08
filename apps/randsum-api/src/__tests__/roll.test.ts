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
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('result')
    expect(data).toHaveProperty('params')
    expect(data).toHaveProperty('notation')
    expect(data.notation).toBe('1d20')
  })

  it('should handle roll with notation parameter', async () => {
    const request = new Request('http://localhost:3000/roll?notation=2d6')
    const response = handleRollRequest(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('result')
    expect(data.notation).toBe('2d6')
  })

  it('should handle roll with individual parameters', async () => {
    const request = new Request(
      'http://localhost:3000/roll?sides=8&quantity=3&plus=2'
    )
    const response = handleRollRequest(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('result')
    expect(data.notation).toBe('3d8+2')
  })

  it('should handle roll with drop modifier', async () => {
    const request = new Request(
      'http://localhost:3000/roll?sides=6&quantity=4&drop_lowest=1'
    )
    const response = handleRollRequest(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('result')
    expect(data.notation).toContain('4d6')
    expect(data.notation).toContain('L')
  })

  it('should return error for invalid notation', async () => {
    const request = new Request('http://localhost:3000/roll?notation=invalid')
    const response = handleRollRequest(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Invalid dice notation')
  })

  it('should return error for invalid sides parameter', async () => {
    const request = new Request('http://localhost:3000/roll?sides=invalid')
    const response = handleRollRequest(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Sides must be a positive number')
  })

  it('should return error for invalid quantity parameter', async () => {
    const request = new Request('http://localhost:3000/roll?quantity=invalid')
    const response = handleRollRequest(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Quantity must be a positive number')
  })
})
