/**
 * Shared test setup — preloaded before all test files via bunfig.toml.
 *
 * discord.js v14 ships CJS source as its entry point (src/index.js).
 * It uses __exportStar from tslib to re-export from discord-api-types,
 * @discordjs/builders, etc. Bun cannot statically analyze __exportStar
 * for ESM named exports, causing "Export named X not found" errors
 * when mock.module replaces the module and Bun falls back to CJS→ESM
 * interop on the real source.
 *
 * Additionally, Bun's mock.module is process-global (not per-file).
 * Having each test file call mock.module('discord.js', ...) with
 * different factories creates non-deterministic behavior based on
 * test execution order.
 *
 * Solution: mock discord.js ONCE here with the superset of all exports
 * used across all source and test files. Every test file shares this
 * mock, eliminating both the CJS→ESM interop issue and the global
 * state race condition.
 */
import { mock } from 'bun:test'

const createChainableMock = (): Record<string, unknown> => {
  const obj: Record<string, unknown> = {}
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') return undefined // prevent Promise-like behavior
      if (typeof prop === 'string' && !obj[prop]) {
        obj[prop] = mock(() => new Proxy({} as Record<string, unknown>, handler))
      }
      return obj[prop]
    }
  }
  return new Proxy(obj, handler)
}

const mockEmbed = createChainableMock()
const mockActionRow = createChainableMock()
const mockButton = createChainableMock()
const mockSelectMenu = createChainableMock()

void mock.module('discord.js', () => ({
  // Builders
  EmbedBuilder: mock(() => mockEmbed),
  ActionRowBuilder: mock(() => mockActionRow),
  ButtonBuilder: mock(() => mockButton),
  StringSelectMenuBuilder: mock(() => mockSelectMenu),
  SlashCommandBuilder: class {
    public name = ''
    public description = ''
    public options: unknown[] = []
    public setName(n: string): this {
      this.name = n
      return this
    }
    public setDescription(d: string): this {
      this.description = d
      return this
    }
    public addStringOption(fn: (o: unknown) => unknown): this {
      const opt = createChainableMock()
      fn(opt)
      this.options.push(opt)
      return this
    }
    public addIntegerOption(fn: (o: unknown) => unknown): this {
      const opt = createChainableMock()
      fn(opt)
      this.options.push(opt)
      return this
    }
    public addNumberOption(fn: (o: unknown) => unknown): this {
      const opt = createChainableMock()
      fn(opt)
      this.options.push(opt)
      return this
    }
  },

  // Enums / constants
  ButtonStyle: { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 },
  ComponentType: { ActionRow: 1, Button: 2, StringSelect: 3 },
  Events: {
    ClientReady: 'ready',
    InteractionCreate: 'interactionCreate',
    GuildCreate: 'guildCreate'
  },
  GatewayIntentBits: { Guilds: 1 },
  MessageFlags: { Ephemeral: 64 },
  Collection: class extends Map {},

  // Client
  Client: class {
    public commands = new Map()
    public guilds = { cache: new Map() }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public once(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public on(): void {}
    public login(): Promise<void> {
      return Promise.resolve()
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public destroy(): void {}
  },

  // REST
  REST: class {
    public setToken(): this {
      return this
    }
  },
  Routes: {
    applicationCommands: () => '',
    applicationGuildCommands: () => ''
  }
}))
