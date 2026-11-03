import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { AVAILABLE_GAMES } from '@randsum/games'
import type { GameShortcode } from '@randsum/games'
import type { InputDeclaration } from '@randsum/games/schema'
import type { RollRecord } from '@randsum/roller'
import { RandsumError } from '@randsum/roller/errors'
import viewHtml from '@randsum/ui/mcp-app-page'
import { z } from 'zod'
import { version as VERSION } from '../package.json'
import { GAME_INPUTS, isRequiredInput, rollGameWithRecords } from './tools/rollGame'
import { rollNotationWithRecords } from './tools/roll'
import { validateNotationInput } from './tools/validate'

/** What a handler returns: its result, and for a roll the records behind it. */
interface Produced {
  readonly value: Record<string, unknown>
  readonly records?: readonly RollRecord[]
}

/**
 * Wraps a plain handler result (or thrown error) in the MCP CallToolResult
 * envelope: JSON text content plus structured content, and `isError` on throw.
 * A roll's records go in `_meta`, which hosts hand to the UI view and keep
 * out of the model's context. A thrown RandsumError also reports its `code`,
 * and the `position` in the notation when it has one, as a second text block.
 * Errors carry no structured content, because clients check structured
 * content against the output schema.
 */
function toResult(produce: () => Produced): CallToolResult {
  try {
    const { value, records } = produce()
    return {
      content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      structuredContent: value,
      ...(records === undefined ? {} : { _meta: { [RECORDS_META_KEY]: records } })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const details =
      error instanceof RandsumError
        ? [
            {
              type: 'text' as const,
              text: JSON.stringify({
                code: error.code,
                ...(error.context?.position !== undefined
                  ? { position: error.context.position }
                  : {})
              })
            }
          ]
        : []
    return {
      content: [{ type: 'text', text: message }, ...details],
      isError: true
    }
  }
}

/** Output of the `roll` tool (RollToolResult). */
const rollOutput = {
  notation: z.string().describe('The notation that was rolled'),
  total: z.number().describe('Combined total across every pool'),
  pools: z
    .array(
      z.object({
        notation: z.string(),
        initialRolls: z
          .array(z.number())
          .describe('Every die as first rolled, before modifiers: dropped dice included'),
        rolls: z.array(z.number()).describe('Die values after modifiers: the dice that count'),
        total: z.number(),
        description: z.string()
      })
    )
    .describe('One entry per dice pool'),
  description: z.string().describe('Human-readable description of the roll')
}

/** Output of the `validate` tool (ValidateToolResult). */
const validateOutput = {
  notation: z.string(),
  valid: z.boolean(),
  description: z.string().optional().describe('Human-readable description when valid'),
  suggestion: z.string().optional().describe('Suggested fix when invalid'),
  error: z.string().optional().describe('Why the notation is invalid')
}

/** Output of the `roll_game` tool (RollGameToolResult). */
const rollGameOutput = {
  game: z.enum(AVAILABLE_GAMES),
  total: z.number(),
  result: z.unknown().describe("The game's interpreted outcome"),
  details: z.unknown().describe('Game-specific extra detail, when the game provides it'),
  initialRolls: z
    .array(z.number())
    .describe("Every die as first rolled, before the game's modifiers: dropped dice included"),
  rolls: z
    .array(z.number())
    .describe("Die values after the game's modifiers: only the dice that count")
}

/** One spec input declaration as a Zod field: type, bounds, enum, description. */
function inputField(decl: InputDeclaration): z.ZodType {
  const base = (() => {
    if (decl.type === 'boolean') return z.boolean()
    if (decl.type === 'string') return decl.enum ? z.enum(decl.enum.map(String)) : z.string()
    const int = z.number().int()
    const atLeast = decl.minimum === undefined ? int : int.min(decl.minimum)
    return decl.maximum === undefined ? atLeast : atLeast.max(decl.maximum)
  })()
  const described = decl.description === undefined ? base : base.describe(decl.description)
  return isRequiredInput(decl) ? described : described.optional()
}

/**
 * Each game's `params` schema, built from the inputs its spec declares. Loose,
 * so a key another game uses is ignored rather than rejected, as before.
 */
const GAME_PARAMS = Object.fromEntries(
  AVAILABLE_GAMES.map(game => [
    game,
    z
      .looseObject(
        Object.fromEntries(
          Object.entries(GAME_INPUTS[game]).map(([name, decl]) => [name, inputField(decl)])
        )
      )
      .describe(`params when game is "${game}"`)
  ])
) as Record<GameShortcode, z.ZodObject>

/**
 * `roll_game` input. `params` is advertised as one object schema per game; the
 * refinement then checks it against the chosen game's schema, so the bounds
 * and required fields that apply are the ones for `game`. A top-level
 * discriminated union would be tighter, but the MCP SDK lists any non-object
 * input schema as an empty object, hiding every field from clients.
 */
const rollGameInput = z
  .object({
    game: z.enum(AVAILABLE_GAMES).describe('Which game system to roll for'),
    params: z
      .union(AVAILABLE_GAMES.map(game => GAME_PARAMS[game]))
      .default({})
      .describe("Game-specific inputs; only the chosen game's fields are used")
  })
  .superRefine(({ game, params }, ctx) => {
    const parsed = GAME_PARAMS[game].safeParse(params)
    if (parsed.success) return
    for (const issue of parsed.error.issues) {
      ctx.addIssue({ code: 'custom', path: ['params', ...issue.path], message: issue.message })
    }
  })

/**
 * The MCP Apps view (the `ui://` extension): `<randsum-mcp-app>` from
 * `@randsum/ui`, built into one self-contained page and inlined here at build
 * time. Hosts that support MCP Apps (Claude among them) render it in a
 * sandboxed frame for `roll` and `roll_game`; every other client ignores it.
 */
const VIEW_URI = 'ui://randsum/roll.html'
const VIEW_MIME_TYPE = 'text/html;profile=mcp-app'

/** The `_meta` key the view reads each roll's records from (matches @randsum/ui). */
const RECORDS_META_KEY = 'randsum/records'

/**
 * Points a tool at the view. `ui.resourceUri` is the spec's key;
 * `ui/resourceUri` is the flat key hosts from before the spec still read.
 */
const VIEW_TOOL_META = { ui: { resourceUri: VIEW_URI }, 'ui/resourceUri': VIEW_URI } as const

/**
 * How hosts frame the view: no border of their own, since the card draws
 * none and its background is the conversation's. The one origin it loads from
 * is Claude's font host, for the font Claude's theme names; everything else
 * is inline.
 */
const VIEW_RESOURCE_META: Record<string, unknown> = {
  ui: { prefersBorder: false, csp: { resourceDomains: ['https://assets.claude.ai'] } }
}

/** Sent to clients on initialize; most hosts put it in the model's context. */
const SERVER_INSTRUCTIONS =
  'RANDSUM rolls tabletop RPG dice with a real random number generator. Call a tool for every roll the user asks for, however simple; never invent dice results or roll them another way, such as with code. Use `roll_game` when the user names a supported game (D&D 5e is `fifth`), `roll` for plain notation such as "4d6L" or "2d20L+5", and `validate` to explain or repair notation. Notation reference: https://notation.randsum.dev/'

/**
 * Every tool only computes: it reads no state, changes nothing, and reaches no
 * outside system. The rolling tools differ from `validate` only in returning a
 * new result on each call.
 */
const LOCAL_COMPUTATION = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false
} as const

/**
 * Builds the RANDSUM MCP server with the `roll`, `validate`, and `roll_game`
 * tools registered. Callers attach a transport via `server.connect(...)`.
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: '@randsum/mcp',
      version: VERSION,
      // What clients show for the server: the RANDSUM pip R mark, the same
      // logo as randsum.dev, rather than whatever icon a client finds cached.
      title: 'RANDSUM',
      websiteUrl: 'https://randsum.dev',
      icons: [
        { src: 'https://randsum.dev/favicon.svg', mimeType: 'image/svg+xml', sizes: ['any'] },
        {
          src: 'https://randsum.dev/brand/randsum-avatar.png',
          mimeType: 'image/png',
          sizes: ['1024x1024']
        }
      ]
    },
    { instructions: SERVER_INSTRUCTIONS }
  )

  server.registerTool(
    'roll',
    {
      title: 'Roll dice',
      description:
        'Rolls dice written in RANDSUM notation (e.g. "4d6L", "2d20+5", "1d100") with a real random number generator. An optional integer seed makes the roll deterministic. Returns the total, the dice of each pool as first rolled and as kept after modifiers, and a description.',
      inputSchema: {
        notation: z.string().describe('RANDSUM dice notation, e.g. "4d6L", "2d20+5", "1d20"'),
        seed: z
          .number()
          .int()
          .optional()
          .describe('Optional integer seed for a deterministic, reproducible roll')
      },
      outputSchema: rollOutput,
      annotations: { title: 'Roll dice', ...LOCAL_COMPUTATION, idempotentHint: false },
      _meta: VIEW_TOOL_META
    },
    input =>
      toResult(() => {
        const { result, records } = rollNotationWithRecords(input)
        return { value: { ...result }, records }
      })
  )

  server.registerTool(
    'validate',
    {
      title: 'Validate dice notation',
      description:
        'Checks RANDSUM dice notation without rolling it. Returns whether it is valid, a plain-language description of what it rolls, and a suggested fix when it is invalid.',
      inputSchema: {
        notation: z.string().describe('RANDSUM dice notation to validate, e.g. "4d6L" or "2d20+5"')
      },
      outputSchema: validateOutput,
      annotations: { title: 'Validate dice notation', ...LOCAL_COMPUTATION, idempotentHint: true }
    },
    input => toResult(() => ({ value: { ...validateNotationInput(input) } }))
  )

  server.registerTool(
    'roll_game',
    {
      title: 'Roll for a game system',
      description:
        "Rolls for one tabletop game system (blades, daggerheart, fate, fifth, pbta, root-rpg, salvageunion) and interprets the dice by that game's rules, returning the game's outcome as well as the total. Game-specific inputs go in `params`.",
      inputSchema: rollGameInput,
      outputSchema: rollGameOutput,
      annotations: { title: 'Roll for a game system', ...LOCAL_COMPUTATION, idempotentHint: false },
      _meta: VIEW_TOOL_META
    },
    ({ game, params }) =>
      toResult(() => {
        const { result, records } = rollGameWithRecords(game, params)
        return { value: { ...result }, records }
      })
  )

  server.registerResource(
    'roll-view',
    VIEW_URI,
    {
      title: 'RANDSUM roll',
      description:
        'The card a host shows for a roll or roll_game result: the total, each step of the dice, and Roll again.',
      mimeType: VIEW_MIME_TYPE,
      _meta: VIEW_RESOURCE_META
    },
    () => ({
      contents: [
        { uri: VIEW_URI, mimeType: VIEW_MIME_TYPE, text: viewHtml, _meta: VIEW_RESOURCE_META }
      ]
    })
  )

  return server
}
