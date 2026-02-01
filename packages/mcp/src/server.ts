import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { config } from './config.js'
import {
  registerAnalyzeTool,
  registerBatchRollTool,
  registerCompareTool,
  registerCountSuccessesTool,
  registerGameRollTool,
  registerPresetTool,
  registerRollTool,
  registerValidateTool
} from './tools/index.js'
import { registerResources } from './resources/index.js'
import { registerPrompts } from './prompts/index.js'

const SERVER_INSTRUCTIONS = `🎲 RANDSUM MCP Server - Advanced Dice Rolling & Game Mechanics Engine

COMPREHENSIVE DICE ROLLING SYSTEM with sophisticated modifiers for tabletop gaming, probability simulation, and randomization tasks.

🚀 CORE CAPABILITIES:
• Execute dice rolls with advanced RANDSUM notation system
• Support for standard polyhedral dice (d4, d6, d8, d10, d12, d20, d100, etc.)
• Complex modifier combinations for sophisticated game mechanics
• Detailed roll breakdowns with individual die results and modifier applications
• Real-time notation validation with comprehensive error feedback

🔧 AVAILABLE TOOLS:

🎯 roll - Advanced Dice Rolling Engine
• Execute sophisticated dice rolls with full modifier support
• Returns detailed breakdowns: total, raw results, modified results, subtotals
• Supports numeric dice (standard gaming)
• Handles complex modifier combinations for advanced game mechanics

🔍 validate-notation - Syntax Validator & Parser
• Validate dice notation before execution to prevent errors
• Detailed parsing feedback showing notation interpretation
• Comprehensive error messages with correction guidance
• Essential for learning syntax and debugging complex expressions

📊 analyze - Probability Analysis
• Analyze probability distribution of dice notation
• Returns statistics: min, max, mean, median, mode, standard deviation
• Provides probability distribution for each possible result
• Uses Monte Carlo simulation for complex modifiers

🎮 game-roll - Unified Game-Specific Rolls
• Roll dice for any supported game system
• Supports: blades, fifth, pbta, daggerheart, root-rpg, salvageunion
• Accepts game-specific arguments as JSON
• Returns game-specific result with details

🔄 batch-roll - Multiple Rolls at Once
• Roll dice multiple times in a single call
• Useful for generating ability scores, initiative, etc.
• Returns individual results plus statistics (sum, average, min, max)
• Supports optional labels for each batch

⚖️ compare - Compare Notation Probabilities
• Compare probability distributions of two dice notations
• Shows statistics for both notations side-by-side
• Calculates mean differences and range overlap
• Useful for comparing different roll options

🎯 count-successes - Dice Pool Success Counting
• Count successes instead of summing dice
• Supports success threshold (rolls >= threshold)
• Optional botch threshold (rolls <= threshold)
• Useful for World of Darkness, Shadowrun, and similar systems

🎲 preset - Pre-configured Roll Presets
• Roll dice using common preset configurations
• Presets: dnd-ability-score, dnd-advantage, dnd-disadvantage, fate-dice, shadowrun-pool
• Supports parameterized presets (e.g., shadowrun-pool with dice count)
• Quick access to common roll patterns

💬 PROMPTS:
• dnd-ability-scores - Generate D&D 5e ability scores
• blades-action - Roll Blades in the Dark action
• combat-round - Roll initiative and attacks
• pbta-roll - Roll Powered by the Apocalypse move

📚 COMPREHENSIVE MODIFIER SYSTEM:

DROP MODIFIERS (L/H): Remove extreme results
• 4d6L - Drop lowest (D&D ability scores)
• 2d20H - Drop highest (disadvantage mechanics)
• 4d6LH - Drop both extremes (middle values)

REROLL MODIFIERS (R): Conditional rerolling
• 4d6R{1} - Reroll 1s (avoid failures)
• 4d6R{<3} - Reroll below threshold
• 4d6R{1,2,6} - Reroll specific values

EXPLODING DICE (!): Cascade rolling
• 3d6! - Reroll and add on maximum (critical hits)
• Open-ended results for dramatic outcomes

UNIQUE RESULTS (U): No duplicates
• 4d20U - All different results (card draws, selections)

CAPPING (C): Range enforcement
• 4d20C{>18} - Cap maximum values
• 4d6C{<2,>5} - Enforce result ranges

ARITHMETIC (+/-): Fixed adjustments
• 2d6+3 - Add modifiers (damage + ability)
• 1d20-2 - Apply penalties

🎮 GAMING APPLICATIONS:
• D&D/Pathfinder: Ability scores, attacks, damage, saves
• Narrative Games: Story prompts, oracle dice, complications
• Probability: Statistical analysis, random sampling
• Custom Systems: Unique mechanics, symbol resolution

💡 LLM INTEGRATION BEST PRACTICES:
• Always validate complex notation before rolling
• Use for character creation, combat resolution, skill challenges
• Combine modifiers for sophisticated game mechanics

📖 COMPLETE REFERENCE:
Access via dice-notation-docs resource for comprehensive syntax guide

🔥 QUICK EXAMPLES:
• 4d6L - D&D ability score (drop lowest)
• 2d20H - Advantage roll (keep highest)
• 3d6! - Exploding damage dice
• 4d6R{1}+3 - Reroll 1s, add modifier
• 1d100+10 - Percentile roll with modifier`

export function createServerInstance(): McpServer {
  const server = new McpServer(config, {
    instructions: SERVER_INSTRUCTIONS
  })

  registerRollTool(server)
  registerValidateTool(server)
  registerAnalyzeTool(server)
  registerGameRollTool(server)
  registerBatchRollTool(server)
  registerCompareTool(server)
  registerCountSuccessesTool(server)
  registerPresetTool(server)
  registerPrompts(server)
  registerResources(server)

  return server
}
