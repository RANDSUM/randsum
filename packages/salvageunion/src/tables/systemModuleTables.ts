import type { SalvageUnionNumericTable, SalvageUnionTableName } from '../types'

export const Mechapult: SalvageUnionNumericTable = {
  1: 'The Mechapult explodes and is destroyed. Deal SP damage equal to 2× the Tech Level of the Scrap to your Mech and everything within Close Range.',
  2: 'The Mechapult overloads collapsing in on itself. Your Mech takes damage equal to the Tech Level of the Scrap and the Mechapult is damaged.',
  3: 'The Mechapult backfires, hitting a random Ally in Range for SP damage equal to the Tech Level of the Scrap.',
  4: 'The Mechapult swings wildly out of control. Your Mech spins in a random direction and hits a random target within Range for SP damage equal to 3× the Tech Level of the Scrap.',
  5: 'Dense slabs of rigid plastics fire from the Mechapult into the ground around you. These act as a barricade protecting your Mech from harm. For the next 10 minutes you may use them as though they were a single Armour Plating System.',
  6: 'A shower of pistons, gears, and mech- anisms scatters across the area wildly. Every target within Long Range, including Allies, takes SP damage equal to the Tech Level of the Scrap.',
  7: ' The Mechapult guzzles up another piece of Scrap and fires them both. A random piece of Scrap your Mech is carrying is loaded onto the Mechapult. Roll on the Mechapult Table twice and resolve both results. If you have no other Scrap, then roll once on the Mechapult Table and resolve the result.',
  8: 'Splat! A wasteland critter was inadvertently caught in the Mechapult when it launched and has smeared gore over the target. The target is hit for Tech Level of the Scrap and must make a Morale Check.',
  9: 'A superheated lump of scrap is fired at the target. The target is hit for SP damage equal to 2× the Tech Level of the Scrap and this attack has the Explosive (X) and Burn (X) Trait where X is the Tech Level of the Scrap. Your Mech gains 2 Heat and must make a Heat Check.',
  10: 'A leaky uranium shell strikes the target. It takes SP damage equal to 3× the Tech Level of the Scrap. The target and the area within Close Range of it becomes Irradiated.',
  11: 'Heavy superconductors charged with electricity arc towards the target. The target and up to three other targets within Medium Range of the target of your choice each take SP damage equal to 2× the Tech Level of the Scrap. Each of these attacks count as having the Ion Trait.',
  12: 'The target is struck by dense coils of wiring looms which wind around it. It takes SP damage equal to 2× the Tech Level of the Scrap and falls Prone.',
  13: 'Streams of superheated gas lash out at the target. The attack deals SP damage equal to the 2× the Tech Level of the Scrap and the attack has the Burn (X) Trait, where X is the Tech Level of the Scrap.',
  14: 'The Mechapult was loaded with crude oil. The target is hit for SP damage equal to 2× the Tech Level of the Scrap and the area around them is coated in slippery, flam- mable oil. This can be ignited and moving within it can cause a Mech or Creature to fall prone.',
  15: 'A chaotic mess of circuit boards hits the target causing a static discharge. The target Mech is Shutdown for one turn.',
  16: 'Shards of refractive glass fire at the target. It is hit for SP damage equal to 2× the Tech Level of the Scrap and the area around the target is hit by multiple rays of dazzling light, blinding the target and everything within Close Range for one round.',
  17: 'A bundle of carbon fibre rods fire at the target. It takes SP damage equal to 3× the Tech Level of the Scrap and is skewered to the ground. It cannot move and gains the Vulnerable Trait until it takes an action to free itself.',
  18: 'The scrap carves through the target flaying chunks off of it. A number of random Systems equal to the Tech Level of the Scrap on the target are damaged. In addition, it takes SP damage equal to the 2× Tech Level of the Scrap',
  19: 'A heavy lump of scrap strikes the target with a devastating blow. The target is hit for SP damage equal to 4× the Tech Level of the Scrap',
  20: 'A dense ball of concentrated scrap hits the target with catastrophic force dealing SP damage equal to 6× the Tech Level of the Scrap.'
}

export const SystemModuleTables: Partial<Record<SalvageUnionTableName, SalvageUnionNumericTable>> =
  {
    ['Mechapult']: Mechapult
  }
