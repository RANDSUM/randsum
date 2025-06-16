/**
 * @file Salvage Union dice rolling for RANDSUM
 * @module @randsum/salvageunion
 *
 * This module provides dice rolling functions specifically designed for
 * the Salvage Union RPG system, implementing the d20 mechanics with
 * success/failure determination and comprehensive roll tables for
 * various game scenarios.
 */

export { rollSU } from './rollSU'

export {
  AllRollTables,
  MechSalvageTable,
  NPCTables,
  PCTables,
  ReactorOverloadTable,
  RollTables
} from './tables'

export type {
  SUHit,
  SUTableListing,
  SUTableName,
  SUTableResult,
  SUTableType
} from './types'

