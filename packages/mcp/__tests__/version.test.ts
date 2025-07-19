import { describe, expect, test } from 'bun:test'
import packageJson from '../package.json'
import { config } from '../src'

describe('MCP Server Version Consistency', () => {
  test('MCP server version should match package.json version', () => {
    expect(packageJson.version).toEqual(config.version)
  })
})
