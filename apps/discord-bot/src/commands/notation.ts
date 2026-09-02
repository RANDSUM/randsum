import { SlashCommandBuilder } from '../utils/builders.js'
import { buildNotationView } from './lib/notationView.js'
import type { Command } from '../types.js'

export const notationCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('notation')
    .setDescription('RANDSUM Dice Notation Reference')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the result visible only to you')
        .setRequired(false)
    ),

  // Only the initial page. Each subsequent category selection arrives as its own
  // POST and is rendered by `dispatchComponent` in src/worker/dispatch.ts — the
  // select menu sends its chosen value back, so there is no session to seed here.
  //
  // This is the one command that had a hand-written `execute`, and the only one
  // that lost real behaviour with it: the gateway kept a five-minute component
  // collector open on the socket and greyed the menu out when it expired. A
  // Worker holds nothing open, so the menu simply stays live — Discord re-POSTs
  // every selection, and a click on a very old message renders the same page it
  // always did rather than a disabled control.
  // Under Components V2 the select menu lives inside the container, so what
  // used to be a separate `buildComponents` returning a detached action row is
  // now part of the one view — and the view is built once rather than twice.
  buildView: () => buildNotationView()
}
