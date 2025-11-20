import { describe, expect, test } from 'bun:test'
import packageJson from '../package.json'
import { GameName, embedFooterDetails } from '../src/core/constants'

describe('@randsum/robo', () => {
  test('package.json has correct name', () => {
    expect(packageJson.name).toBe('@randsum/robo')
  })

  test('package.json has version', () => {
    expect(packageJson.version).toBeDefined()
    expect(typeof packageJson.version).toBe('string')
  })

  test('package.json is private', () => {
    expect(packageJson.private).toBe(true)
  })

  test('constants are defined', () => {
    expect(GameName).toBeDefined()
    expect(embedFooterDetails).toBeDefined()
    expect(embedFooterDetails.text).toBeDefined()
  })

  test('package.json has required dependencies', () => {
    expect(packageJson.dependencies).toBeDefined()
    expect(packageJson.dependencies['@randsum/roller']).toBeDefined()
    expect(packageJson.dependencies['robo.js']).toBeDefined()
    expect(packageJson.dependencies['discord.js']).toBeDefined()
  })
})
