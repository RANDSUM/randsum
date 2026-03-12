import { describe, expect, test } from 'bun:test'
import { generateCode } from '../src/codegen'
import { loadSpec } from '../src/loader'
import { validateSpec } from '../src'

describe('#990: duplicate plus bug', () => {
  const MULTI_ADD_SPEC = {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Multi Add Test',
    shortcode: 'test-multi-add',
    game_url: 'https://example.com',
    roll: {
      inputs: {
        stat: { type: 'integer' as const, default: 0 },
        forward: { type: 'integer' as const, default: 0 },
        ongoing: { type: 'integer' as const, default: 0 }
      },
      dice: { pool: { sides: 6 }, quantity: 2 },
      modify: [
        { add: { $input: 'stat' } },
        { add: { $input: 'forward' } },
        { add: { $input: 'ongoing' } }
      ],
      resolve: 'sum' as const
    }
  }

  test('emits single plus with summed adds', async () => {
    const code = await generateCode(MULTI_ADD_SPEC)
    const plusMatches = code.match(/plus:/g)
    expect(plusMatches).toHaveLength(1)
  })

  test('emits add expressions joined with +', async () => {
    const code = await generateCode(MULTI_ADD_SPEC)
    expect(code).toContain(
      'plus: (input?.stat ?? 0) + (input?.forward ?? 0) + (input?.ongoing ?? 0)'
    )
  })
})

describe('#991: enum union types', () => {
  const ENUM_SPEC = {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Enum Test',
    shortcode: 'test-enum',
    game_url: 'https://example.com',
    roll: {
      inputs: {
        rollingWith: {
          type: 'string' as const,
          enum: ['Advantage', 'Disadvantage'],
          optional: true
        }
      },
      dice: { pool: { sides: 20 }, quantity: 1 },
      resolve: 'sum' as const
    }
  }

  test('spec with optional and enum is valid', () => {
    const result = validateSpec(ENUM_SPEC)
    expect(result.valid).toBe(true)
  })

  test('emits enum values as union type', async () => {
    const code = await generateCode(ENUM_SPEC)
    expect(code).toContain("'Advantage' | 'Disadvantage'")
    expect(code).not.toMatch(/rollingWith\??: string\b/)
  })

  test('optional input without default emits ? in signature', async () => {
    const code = await generateCode(ENUM_SPEC)
    expect(code).toContain('rollingWith?:')
  })

  test('single-input overload uses baseType for typeof check', async () => {
    const code = await generateCode(ENUM_SPEC)
    expect(code).toContain("typeof rawInput === 'string'")
    expect(code).not.toContain("typeof rawInput === ''Advantage'")
  })
})

describe('#10: validation codegen', () => {
  const VALIDATED_SPEC = {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Root RPG',
    shortcode: 'test-validation',
    game_url: 'https://example.com',
    roll: {
      inputs: {
        bonus: { type: 'integer' as const, minimum: -20, maximum: 20, default: 0 }
      },
      dice: { pool: { sides: 6 }, quantity: 2 },
      postResolveModifiers: [{ add: { $input: 'bonus' } }],
      resolve: 'sum' as const
    }
  }

  test('emits validateFinite and validateRange imports', async () => {
    const code = await generateCode(VALIDATED_SPEC)
    expect(code).toContain('validateFinite')
    expect(code).toContain('validateRange')
    expect(code).toMatch(/import \{.*validateFinite.*\} from '@randsum\/gameSchema'/)
  })

  test('emits validateFinite call', async () => {
    const code = await generateCode(VALIDATED_SPEC)
    expect(code).toContain("validateFinite(input?.bonus, 'Root RPG bonus')")
  })

  test('emits validateRange call with min and max', async () => {
    const code = await generateCode(VALIDATED_SPEC)
    expect(code).toContain("validateRange(input?.bonus, -20, 20, 'Root RPG bonus')")
  })

  test('runtime throws on NaN', () => {
    const loaded = loadSpec(VALIDATED_SPEC)
    expect(() => loaded.roll({ bonus: NaN })).toThrow('Root RPG bonus must be a finite number')
  })

  test('runtime throws on out-of-range', () => {
    const loaded = loadSpec(VALIDATED_SPEC)
    expect(() => loaded.roll({ bonus: 1000 })).toThrow('Root RPG bonus must be between -20 and 20')
  })

  test('no validation imports when no integer inputs', async () => {
    const noIntSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'No Int',
      shortcode: 'test-noint',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(noIntSpec)
    expect(code).not.toContain('validateFinite')
    expect(code).not.toContain('validateRange')
  })
})

describe('#995: validation description label', () => {
  test('uses description field as validation label when present', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Test Game',
      shortcode: 'test-desc',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          bonus: {
            type: 'integer' as const,
            minimum: -10,
            maximum: 10,
            default: 0,
            description: 'custom label'
          }
        },
        dice: { pool: { sides: 20 }, quantity: 1 },
        postResolveModifiers: [{ add: { $input: 'bonus' } }],
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain("validateFinite(input?.bonus, 'custom label')")
    expect(code).toContain("validateRange(input?.bonus, -10, 10, 'custom label')")
    expect(code).not.toContain('Test Game bonus')
  })

  test('falls back to spec name + field name when no description', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Fallback Test',
      shortcode: 'test-fallback',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          bonus: { type: 'integer' as const, minimum: -5, maximum: 5, default: 0 }
        },
        dice: { pool: { sides: 20 }, quantity: 1 },
        postResolveModifiers: [{ add: { $input: 'bonus' } }],
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain("validateFinite(input?.bonus, 'Fallback Test bonus')")
  })

  test('runtime uses description for error message', () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Desc Runtime',
      shortcode: 'test-descrt',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          bonus: {
            type: 'integer' as const,
            minimum: -5,
            maximum: 5,
            default: 0,
            description: '5E modifier'
          }
        },
        dice: { pool: { sides: 20 }, quantity: 1 },
        postResolveModifiers: [{ add: { $input: 'bonus' } }],
        resolve: 'sum' as const
      }
    }
    const loaded = loadSpec(spec)
    expect(() => loaded.roll({ bonus: 100 })).toThrow('5E modifier must be between -5 and 5')
  })
})

describe('#995: string enum validation', () => {
  const ENUM_GUARD_SPEC = {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Enum Guard Test',
    shortcode: 'test-enumguard',
    game_url: 'https://example.com',
    roll: {
      inputs: {
        mode: {
          type: 'string' as const,
          enum: ['Alpha', 'Beta'],
          optional: true
        }
      },
      dice: { pool: { sides: 20 }, quantity: 1 },
      resolve: 'sum' as const
    }
  }

  test('codegen emits enum validation guard', async () => {
    const code = await generateCode(ENUM_GUARD_SPEC)
    expect(code).toContain("!['Alpha', 'Beta'].includes(")
    expect(code).toContain('Invalid mode value')
  })

  test('runtime throws on invalid enum value', () => {
    const loaded = loadSpec(ENUM_GUARD_SPEC)
    expect(() => loaded.roll({ mode: 'Gamma' })).toThrow(
      "Invalid mode value: Gamma. Must be 'Alpha' or 'Beta'."
    )
  })

  test('runtime accepts valid enum value', () => {
    const loaded = loadSpec(ENUM_GUARD_SPEC)
    expect(() => loaded.roll({ mode: 'Alpha' })).not.toThrow()
  })

  test('runtime accepts undefined for optional enum', () => {
    const loaded = loadSpec(ENUM_GUARD_SPEC)
    expect(() => loaded.roll()).not.toThrow()
  })
})
