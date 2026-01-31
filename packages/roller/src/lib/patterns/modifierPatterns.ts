/* eslint-disable @typescript-eslint/no-inferrable-types */
export const dropHighestPattern: RegExp = /[Hh](\d+)?/
export const dropLowestPattern: RegExp = /[Ll](\d+)?/
export const dropConstraintsPattern: RegExp = /[Dd]\{([^}]{1,50})\}/
export const keepHighestPattern: RegExp = /[Kk](?![Ll])(\d+)?/
export const keepLowestPattern: RegExp = /[Kk][Ll](\d+)?/
// Supports ! (explode once) or !N (max depth)
// Uses negative lookbehind and lookahead to avoid matching !! (compound) or !p (penetrate)
export const explodePattern: RegExp = /(?<![!])!(?![!p])(\d+)?/i
// Compounding: !! or !!N (but not if it's part of explode pattern)
// Note: This must be checked before explodePattern to avoid conflicts
export const compoundPattern: RegExp = /!!(\d+)?/
// Penetrating: !p or !pN
export const penetratePattern: RegExp = /!p(\d+)?/i
export const uniquePattern: RegExp = /[Uu](\{([^}]{1,50})\})?/
export const replacePattern: RegExp = /[Vv]\{([^}]{1,50})\}/
export const rerollPattern: RegExp = /[Rr]\{([^}]{1,50})\}(\d+)?/
export const capPattern: RegExp = /[Cc]\{([^}]{1,50})\}/
// Success counting: S{>=8} or S{>7} for success counting
export const successPattern: RegExp = /[Ss]\{([<>=]+)(\d+)\}/
// Pre-arithmetic multiply: *N (but not **)
export const multiplyPattern: RegExp = /(?<!\*)\*(?!\*)(\d+)/
// Total multiply: **N
export const multiplyTotalPattern: RegExp = /\*\*(\d+)/
export const plusPattern: RegExp = /\+(\d+)/
export const minusPattern: RegExp = /-(\d+)/
