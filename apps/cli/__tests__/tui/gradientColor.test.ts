import { describe, expect, test } from 'bun:test'
import { lerpColor } from '../../src/tui/helpers/gradientColor'

describe('lerpColor', () => {
  test('t=0 returns start color exactly', () => {
    expect(lerpColor('#3b82f6', '#93c5fd', 0)).toBe('#3b82f6')
  })

  test('t=1 returns end color exactly', () => {
    expect(lerpColor('#3b82f6', '#93c5fd', 1)).toBe('#93c5fd')
  })

  test('t=0.5 returns midpoint between the two colors', () => {
    expect(lerpColor('#3b82f6', '#93c5fd', 0.5)).toBe('#67a4fa')
  })

  test('returns lowercase hex string', () => {
    expect(lerpColor('#ffffff', '#000000', 0.5)).toMatch(/^#[0-9a-f]{6}$/)
  })

  test('handles identical start and end', () => {
    expect(lerpColor('#3b82f6', '#3b82f6', 0.5)).toBe('#3b82f6')
  })

  test('t below 0 is clamped to 0', () => {
    expect(lerpColor('#3b82f6', '#93c5fd', -1)).toBe('#3b82f6')
  })

  test('t above 1 is clamped to 1', () => {
    expect(lerpColor('#3b82f6', '#93c5fd', 2)).toBe('#93c5fd')
  })
})
