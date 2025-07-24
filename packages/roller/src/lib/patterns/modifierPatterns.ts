/* eslint-disable @typescript-eslint/no-inferrable-types */
export const dropHighestPattern: RegExp = /[Hh](\d+)?/
export const dropLowestPattern: RegExp = /[Ll](\d+)?/
export const dropConstraintsPattern: RegExp = /[Dd]\{([^}]{1,50})\}/
export const explodePattern: RegExp = /!/
export const uniquePattern: RegExp = /[Uu](\{([^}]{1,50})\})?/
export const replacePattern: RegExp = /[Vv]\{([^}]{1,50})\}/
export const rerollPattern: RegExp = /[Rr]\{([^}]{1,50})\}(\d+)?/
export const capPattern: RegExp = /[Cc]\{([^}]{1,50})\}/
export const plusPattern: RegExp = /\+(\d+)/
export const minusPattern: RegExp = /-(\d+)/
