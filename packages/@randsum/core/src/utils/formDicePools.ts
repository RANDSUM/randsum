import { randomUUIDv7 as uuid } from 'bun'

export function formDicePools<R, A>(
  args: A[],
  transformer: (arg: A) => R
): { [key: string]: R } {
  return args.reduce((acc, arg) => ({ ...acc, [uuid()]: transformer(arg) }), {})
}
