/**
 * The transport-agnostic slice of an interaction.
 *
 * Every command's actual work — read some options, compute a roll, build an
 * embed — needs almost nothing from discord.js. It needs three option getters
 * and, in one case, the caller's display name. Everything else about
 * `ChatInputCommandInteraction` is transport: a live gateway connection, a
 * client, reply methods that write back over a socket.
 *
 * Naming that slice is what makes the bot portable. A gateway bot satisfies
 * this interface from `interaction.options`; an HTTP-interactions Worker
 * satisfies it by reading the raw JSON Discord POSTs. Neither knows about the
 * other, and the command bodies know about neither.
 *
 * This is deliberately the *smallest* interface that covers current usage
 * rather than a general-purpose wrapper. A wider surface would be easier to
 * write against and much easier to accidentally couple to one transport again.
 */

/**
 * Option accessors, matching the subset of discord.js's shape actually used.
 *
 * Overloaded rather than plain `=> T | null` so that `required: true` narrows to
 * a non-null result, exactly as discord.js does. Without the overloads every
 * call site of a required option would need a redundant null check for a case
 * Discord's own validation makes impossible.
 */
export interface CommandOptions {
  getString(name: string, required: true): string
  getString(name: string, required?: boolean): string | null
  getInteger(name: string, required: true): number
  getInteger(name: string, required?: boolean): number | null
  getBoolean(name: string, required: true): boolean
  getBoolean(name: string, required?: boolean): boolean | null
}

export interface CommandContext {
  readonly options: CommandOptions
  /**
   * The invoking user's display name. Only `/root` uses it, but it is here
   * rather than passed separately because it is interaction data, and routing
   * it around the context would put a second transport-shaped argument back
   * into every signature.
   */
  readonly userDisplayName: string
}

/**
 * Read options out of a raw Discord interaction payload.
 *
 * Discord sends options as a flat array of `{ name, type, value }`. This maps
 * that to the same accessor shape discord.js exposes, so one command body
 * serves both transports.
 *
 * `required` is accepted and ignored on purpose: discord.js throws when a
 * required option is missing, but Discord itself will not send a command
 * invocation missing a required option — its own validation runs first.
 * Throwing here would turn a protocol impossibility into a runtime risk.
 */
export function optionsFromPayload(
  raw: readonly { readonly name: string; readonly value?: unknown }[] | undefined
): CommandOptions {
  const byName = new Map((raw ?? []).map(option => [option.name, option.value]))

  // Declared as functions rather than object-literal properties because only
  // function declarations can carry overload signatures, and the overloads are
  // what let `required: true` narrow away the null.
  function getString(name: string, required: true): string
  function getString(name: string, required?: boolean): string | null
  function getString(name: string): string | null {
    const value = byName.get(name)
    return typeof value === 'string' ? value : null
  }

  function getInteger(name: string, required: true): number
  function getInteger(name: string, required?: boolean): number | null
  function getInteger(name: string): number | null {
    const value = byName.get(name)
    return typeof value === 'number' ? value : null
  }

  function getBoolean(name: string, required: true): boolean
  function getBoolean(name: string, required?: boolean): boolean | null
  function getBoolean(name: string): boolean | null {
    const value = byName.get(name)
    return typeof value === 'boolean' ? value : null
  }

  return { getString, getInteger, getBoolean }
}
