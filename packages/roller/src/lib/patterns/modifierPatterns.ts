/* eslint-disable @typescript-eslint/no-inferrable-types */
import { REGEX_PATTERNS } from '../constants'

const { BRACED_CONTENT, OPTIONAL_DIGITS } = REGEX_PATTERNS

export const dropHighestPattern: RegExp = /[Hh](\d+)?/
export const dropLowestPattern: RegExp = /[Ll](\d+)?/
export const dropConstraintsPattern: RegExp = new RegExp(`[Dd]\\{${BRACED_CONTENT}\\}`)

export const uniquePattern: RegExp = new RegExp(`[Uu](\\{${BRACED_CONTENT}\\})?`)
export const replacePattern: RegExp = new RegExp(`[Vv]\\{${BRACED_CONTENT}\\}`)
export const rerollPattern: RegExp = new RegExp(`[Rr]\\{${BRACED_CONTENT}\\}${OPTIONAL_DIGITS}`)
export const capPattern: RegExp = new RegExp(`[Cc]\\{${BRACED_CONTENT}\\}`)

export const explodePattern: RegExp = /!/
export const plusPattern: RegExp = new RegExp(`\\+${OPTIONAL_DIGITS}`)
export const minusPattern: RegExp = new RegExp(`-${OPTIONAL_DIGITS}`)
