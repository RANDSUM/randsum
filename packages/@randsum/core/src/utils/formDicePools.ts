import { v4 as uuid } from 'uuid'

export function formDicePools<R, A>(
  args: A[],
  transformer: (arg: A) => R
): { [key: string]: R } {
  return args.reduce((acc, arg) => ({ ...acc, [uuid()]: transformer(arg) }), {})
}
