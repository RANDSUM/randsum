//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const dropHighestPattern: RegExp = /[Hh]\d*/g
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const dropLowestPattern: RegExp = /[Ll]\d*/g
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const uniquePattern: RegExp = /[Uu]({(\d+,)*(\d+)})?/g
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const plusPattern: RegExp = /\+\d+/g
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const minusPattern: RegExp = /-\d+/g
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const explodePattern: RegExp = /!/g

//eslint-disable-next-line @typescript-eslint/no-inferrable-types
const coreGreaterLessThan: RegExp = /[<>]?\d+/
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
const coreGreaterLessThanEquals: RegExp = new RegExp(
  coreGreaterLessThan.source + /=?\d+/.source
)

function createRepeatedPattern(core: RegExp): RegExp {
  return new RegExp(`{(${core.source},)*(${core.source})}`, 'g')
}

const greaterThanLessEqualityThanMatcher: RegExp = createRepeatedPattern(
  coreGreaterLessThanEquals
)
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const replacePattern: RegExp = new RegExp(
  /[Vv]/.source + greaterThanLessEqualityThanMatcher.source,
  'g'
)

const greaterThanLessThanMatcher: RegExp =
  createRepeatedPattern(coreGreaterLessThan)
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const dropConstraintsPattern: RegExp = new RegExp(
  /[Dd]/.source + greaterThanLessThanMatcher.source,
  'g'
)

//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const rerollPattern: RegExp = new RegExp(
  `${/[Rr]/.source}${greaterThanLessThanMatcher.source}${/\d*/.source}`,
  'g'
)

//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const capPattern: RegExp = new RegExp(
  `${/[Cc]/.source}${greaterThanLessThanMatcher.source}`,
  'g'
)
