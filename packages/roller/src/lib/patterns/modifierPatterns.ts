/* eslint-disable @typescript-eslint/no-inferrable-types */
export const dropHighestPattern: RegExp = /[Hh](\d+)?/
export const dropLowestPattern: RegExp = /[Ll](\d+)?/
export const dropConstraintsPattern: RegExp = /[Dd]\{([^}]+)\}/
export const explodePattern: RegExp = /!/
export const uniquePattern: RegExp = /[Uu](\{([^}]+)\})?/
export const replacePattern: RegExp = /[Vv]\{([^}]+)\}/
export const rerollPattern: RegExp = /[Rr]\{([^}]+)\}(\d+)?/
export const capPattern: RegExp = /[Cc]\{([^}]+)\}/
export const plusPattern: RegExp = /\+(\d+)/
export const minusPattern: RegExp = /-(\d+)/
