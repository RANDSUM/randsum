import type { Command } from '../types.js'
import { setCommandRegistry } from './lib/registry.js'
import { bladesCommand } from './blades.js'
import { dhCommand } from './dh.js'
import { fateCommand } from './fate.js'
import { fifthCommand } from './fifth.js'
import { helpCommand } from './help.js'
import { notationCommand } from './notation.js'
import { pbtaCommand } from './pbta.js'
import { rollCommand } from './roll.js'
import { rootCommand } from './root.js'
import { salvageUnionCommand } from './salvageunion.js'

const commandList: readonly Command[] = [
  bladesCommand,
  dhCommand,
  fateCommand,
  fifthCommand,
  helpCommand,
  notationCommand,
  pbtaCommand,
  rollCommand,
  rootCommand,
  salvageUnionCommand
]

// Published for `/help`, which needs the list of its siblings. Pushed rather
// than imported so `/help` never has to import this barrel, which would be a
// cycle — see lib/registry.ts.
setCommandRegistry(commandList)

export const commands: readonly Command[] = commandList
