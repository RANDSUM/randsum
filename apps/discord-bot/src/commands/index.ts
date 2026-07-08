import type { Command } from '../types.js'
import { bladesCommand } from './blades.js'
import { dhCommand } from './dh.js'
import { fateCommand } from './fate.js'
import { fifthCommand } from './fifth.js'
import { helpCommand } from './help.js'
import { notationCommand } from './notation.js'
import { pbtaCommand } from './pbta.js'
import { rollCommand } from './roll.js'
import { rootCommand } from './root.js'
import { suCommand } from './su.js'

export const commands: readonly Command[] = [
  bladesCommand,
  dhCommand,
  fateCommand,
  fifthCommand,
  helpCommand,
  notationCommand,
  pbtaCommand,
  rollCommand,
  rootCommand,
  suCommand
]
