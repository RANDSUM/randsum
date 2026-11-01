import { ERROR_CODES, type ErrorCode, NotationParseError, RandsumError } from '../errors'
import { notationOptionsToParams } from '../roll/parseArguments'
import { parseNotation } from './lexer/parse'
import { parsedToOptions } from './parse/notationToOptions'
import type { DiceNotation } from './types'
import type { InvalidValidationResult, ValidValidationResult, ValidationResult } from './types'
import { optionsToDescription } from './transformers/optionsToDescription'
import { formatNotation } from './transformers/optionsToNotation'

function invalid(
  notation: string,
  message: string,
  position: number | undefined,
  code: ErrorCode = ERROR_CODES.INVALID_NOTATION
): InvalidValidationResult {
  return {
    valid: false,
    argument: notation,
    error: { message, argument: notation, code, ...(position !== undefined ? { position } : {}) }
  }
}

function buildOptions(
  notation: string,
  parsed: Parameters<typeof parsedToOptions>[1]
): ReturnType<typeof parsedToOptions> | NotationParseError {
  try {
    return parsedToOptions(notation, parsed)
  } catch (error) {
    if (error instanceof NotationParseError) return error
    throw error
  }
}

function isErrorCode(code: string): code is ErrorCode {
  return Object.values(ERROR_CODES).some(known => known === code)
}

function poolProblem(
  notation: string,
  options: Parameters<typeof notationOptionsToParams>[1]
): RandsumError<ErrorCode> | undefined {
  try {
    notationOptionsToParams(notation, options, 1)
    return undefined
  } catch (error) {
    if (error instanceof RandsumError && isErrorCode(error.code)) return error
    throw error
  }
}

/**
 * Validates dice notation and returns parsed information.
 *
 * Both validity and error position come from the single cursor parser, so an
 * invalid result reports the real character offset where parsing failed
 * (`error.position`) instead of a generic message.
 *
 * @param notation - String to validate as dice notation
 * @returns ValidationResult with valid flag and error (if invalid)
 */
export function validateNotation(notation: string): ValidationResult {
  const parsed = typeof notation === 'string' ? parseNotation(notation) : null

  if (!parsed?.valid) {
    return invalid(notation, `Invalid dice notation: "${notation}"`, parsed?.error?.position)
  }

  // The repeat limits (count and nesting depth) are enforced while building
  // options, after the grammar accepted the string; report them, never throw.
  const built = buildOptions(notation, parsed)
  if (built instanceof NotationParseError) {
    return invalid(notation, built.message, built.context?.position)
  }
  const options = built

  // A string the grammar accepts can still be one roll() rejects before rolling:
  // too many dice or sides, or a modifier its pool cannot satisfy (2d6L3, 3d2U,
  // 1d6R{7}). Run the same checks so that valid means it rolls.
  const rejected = poolProblem(notation, options)
  if (rejected !== undefined) {
    return invalid(notation, rejected.message, rejected.context?.position, rejected.code)
  }

  const result: ValidValidationResult = {
    valid: true,
    argument: notation as DiceNotation,
    options,
    notation: options.map(o => formatNotation(o)),
    description: options.map(o => optionsToDescription(o)),
    error: null
  }
  return result
}
