import { describe, expect, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext } from './lib/context.js'

const { salvageUnionCommand } = await import('../../src/commands/salvageunion.js')

function render(): APIEmbed {
  return salvageUnionCommand.buildEmbed!(makeContext()).toJSON()
}

describe('salvageUnionCommand', () => {
  test('is registered as /salvageunion, not /su', () => {
    expect(salvageUnionCommand.data.name).toBe('salvageunion')
  })

  test('takes no table option — it no longer rolls', () => {
    const options = salvageUnionCommand.data.toJSON().options ?? []
    expect(options.map(option => option.name)).toEqual(['hidden'])
  })

  test('points at the SURef bot instead of rolling', () => {
    const embed = render()
    expect(embed.title).toBe('Salvage Union has moved')
    expect(embed.description).toContain('SURef')
  })

  test('includes the SURef invite and info links', () => {
    const fieldValues = (render().fields ?? []).map(field => field.value).join('\n')
    expect(fieldValues).toContain('client_id=1442878052823470172')
    expect(fieldValues).toContain('https://salvageunion.io/discord')
  })
})
