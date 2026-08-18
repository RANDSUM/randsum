/**
 * Startup reconciliation of Discord's registered slash commands.
 *
 * The command barrel is the source of truth for what the bot can handle, but
 * Discord keeps its own copy, and nothing kept the two in step: registration
 * was a manual `bun run deploy-commands` that a deploy could not enforce and a
 * reviewer could not see. When it was forgotten (#1191 renamed `/su` to
 * `/salvageunion`), Discord kept advertising a command the running code no
 * longer had, for a week.
 *
 * This closes the loop in-process, after login, so ordering is always correct:
 * the handlers are live *before* the registry can advertise them. It is a
 * reconcile, not a blind write — the remote set is fetched and compared first,
 * so a restart with no command change costs one GET and logs `unchanged`,
 * leaving Discord's per-application daily command-write budget for real edits.
 *
 * A sync failure must never take down a working bot: everything here is caught
 * and reported, and the worst case is a bot that runs with the command list it
 * already had.
 */
import { REST, Routes } from './discord.js'
import type { Command } from '../types.js'
import { logger } from './logger.js'
import { captureException } from './errorTracker.js'

/**
 * Discord's own route shape. Mirroring discord.js's `RouteLike` (rather than a
 * plain `string`) is what keeps a real `REST` instance assignable to `RestLike`.
 */
export type DiscordRoute = `/${string}`

/** Minimal REST surface used here — lets tests inject a fake with no network. */
export interface RestLike {
  readonly get: (route: DiscordRoute) => Promise<unknown>
  readonly put: (route: DiscordRoute, options: { readonly body: unknown }) => Promise<unknown>
}

export interface SyncCommandsOptions {
  readonly token: string
  readonly clientId: string
  readonly guildId?: string | undefined
  readonly commands: readonly Command[]
  /** Injected in tests; defaults to a real REST client bound to `token`. */
  readonly rest?: RestLike | undefined
}

export type SyncStatus = 'unchanged' | 'updated' | 'failed'

export interface SyncResult {
  readonly status: SyncStatus
  readonly localCount: number
  readonly remoteCount: number
  readonly scope: 'guild' | 'global'
}

/**
 * The comparable shape of a command. Discord echoes back fields we never set
 * (id, application_id, version, integration_types, …) and fills defaults for
 * ones we omit, so a raw deep-equal always reports "changed". Normalizing both
 * sides to just the fields the bot actually declares is what makes the
 * comparison stable across restarts.
 */
interface NormalizedOption {
  readonly type: number
  readonly name: string
  readonly description: string
  readonly required: boolean
  readonly autocomplete: boolean
  readonly choices: readonly { readonly name: string; readonly value: string | number }[]
  readonly options: readonly NormalizedOption[]
}

interface NormalizedCommand {
  readonly type: number
  readonly name: string
  readonly description: string
  readonly options: readonly NormalizedOption[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

function readNumber(source: Record<string, unknown>, key: string, fallback: number): number {
  const value = source[key]
  return typeof value === 'number' ? value : fallback
}

function readBoolean(source: Record<string, unknown>, key: string): boolean {
  return source[key] === true
}

function readArray(source: Record<string, unknown>, key: string): readonly unknown[] {
  const value = source[key]
  return Array.isArray(value) ? value : []
}

function normalizeChoice(value: unknown): {
  readonly name: string
  readonly value: string | number
} {
  if (!isRecord(value)) return { name: '', value: '' }
  const choiceValue = value['value']
  return {
    name: readString(value, 'name'),
    value: typeof choiceValue === 'number' ? choiceValue : String(choiceValue ?? '')
  }
}

function normalizeOption(value: unknown): NormalizedOption {
  if (!isRecord(value)) {
    return {
      type: 0,
      name: '',
      description: '',
      required: false,
      autocomplete: false,
      choices: [],
      options: []
    }
  }

  return {
    // Option order is semantic to Discord (required options must come first),
    // so nested options and choices keep their declared order — only the
    // top-level command list is sorted.
    type: readNumber(value, 'type', 0),
    name: readString(value, 'name'),
    description: readString(value, 'description'),
    required: readBoolean(value, 'required'),
    autocomplete: readBoolean(value, 'autocomplete'),
    choices: readArray(value, 'choices').map(normalizeChoice),
    options: readArray(value, 'options').map(normalizeOption)
  }
}

function normalizeCommand(value: unknown): NormalizedCommand {
  if (!isRecord(value)) {
    return { type: 1, name: '', description: '', options: [] }
  }

  return {
    // CHAT_INPUT (1) is Discord's default and SlashCommandBuilder omits it.
    type: readNumber(value, 'type', 1),
    name: readString(value, 'name'),
    description: readString(value, 'description'),
    options: readArray(value, 'options').map(normalizeOption)
  }
}

function normalizeAll(values: readonly unknown[]): readonly NormalizedCommand[] {
  return values
    .map(normalizeCommand)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Structural equality over the normalized shape (field order is fixed above). */
function sameCommandSet(a: readonly NormalizedCommand[], b: readonly NormalizedCommand[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Reconcile Discord's registered commands with the local barrel. Resolves with
 * a `SyncResult` in every case — including failure — so a call site can never
 * turn a registry problem into a crashed bot.
 */
export async function syncCommands(options: SyncCommandsOptions): Promise<SyncResult> {
  const { token, clientId, guildId, commands } = options
  const scope: 'guild' | 'global' = guildId === undefined || guildId === '' ? 'global' : 'guild'

  try {
    // Inside the try on purpose. `toJSON()` validates the builder and throws on
    // an invalid command (a too-long description, a bad option name), and
    // `Routes.*`/`new REST()` can throw on malformed credentials. Built above
    // the try, any of those would reject this function — and since the sole
    // call site is a top-level `await` in `index.ts`, that rejection exits the
    // worker, turning "one bad command definition" into a boot crash loop on
    // Render. The contract this module documents is that a registry problem
    // never takes down a connected bot; that has to include building the
    // request, not just sending it.
    const localPayload = commands.map(command => command.data.toJSON())
    const route: DiscordRoute =
      scope === 'guild'
        ? Routes.applicationGuildCommands(clientId, guildId ?? '')
        : Routes.applicationCommands(clientId)

    const rest: RestLike = options.rest ?? new REST().setToken(token)

    const remoteRaw = await rest.get(route)
    const remote = normalizeAll(Array.isArray(remoteRaw) ? remoteRaw : [])
    const local = normalizeAll(localPayload)

    if (sameCommandSet(local, remote)) {
      logger.info('commands.sync.unchanged', {
        scope,
        count: local.length
      })
      return {
        status: 'unchanged',
        localCount: local.length,
        remoteCount: remote.length,
        scope
      }
    }

    const localNames = local.map(command => command.name)
    const remoteNames = remote.map(command => command.name)

    await rest.put(route, { body: localPayload })

    logger.info('commands.sync.updated', {
      scope,
      localCount: local.length,
      remoteCount: remote.length,
      added: localNames.filter(name => !remoteNames.includes(name)),
      removed: remoteNames.filter(name => !localNames.includes(name))
    })

    return {
      status: 'updated',
      localCount: local.length,
      remoteCount: remote.length,
      scope
    }
  } catch (error) {
    // Deliberately swallowed: a registry sync failure is not a reason to take
    // down a bot that is otherwise connected and serving its existing commands.
    captureException(error, { phase: 'commands.sync', scope })
    logger.error('commands.sync.failed', { scope })
    return {
      status: 'failed',
      localCount: commands.length,
      remoteCount: 0,
      scope
    }
  }
}
