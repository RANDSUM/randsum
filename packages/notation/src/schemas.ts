import type { NotationSchema } from './schema'

export type { NotationSchema }

/**
 * Define a notation schema with type checking.
 * This is a type-safe factory for creating notation schemas.
 *
 * @param schema - Complete notation schema
 * @returns The schema unchanged (identity function for type checking)
 */
export function defineNotationSchema<TOptions>(
  schema: NotationSchema<TOptions>
): NotationSchema<TOptions> {
  return schema
}

export {
  capSchema,
  dropSchema,
  keepSchema,
  replaceSchema,
  rerollSchema,
  explodeSchema,
  compoundSchema,
  penetrateSchema,
  uniqueSchema,
  countSuccessesSchema,
  multiplySchema,
  plusSchema,
  minusSchema,
  multiplyTotalSchema
} from './definitions'
