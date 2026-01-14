# Game System Reference

RANDSUM provides specialized packages for popular tabletop RPG systems.

## D&D 5th Edition (@randsum/fifth)

The `@randsum/fifth` package provides D&D 5E-specific mechanics.

### Core Mechanics

**Advantage/Disadvantage**:

- Advantage: Roll 2d20, keep highest → `2d20L`
- Disadvantage: Roll 2d20, keep lowest → `2d20H`

**Ability Scores**:

- Standard Array: 15, 14, 13, 12, 10, 8
- Rolling: `4d6L` (roll 4d6, drop lowest) × 6

**Attack Rolls**:

- `1d20 + ability modifier + proficiency bonus`
- Natural 20 = Critical Hit (double damage dice)
- Natural 1 = Automatic Miss

**Saving Throws**:

- `1d20 + ability modifier + proficiency (if proficient)`
- DC set by spell/ability

### Common Patterns

```
1d20+5         → Attack roll (+5 modifier)
2d20L+5        → Attack with advantage
2d20H+5        → Attack with disadvantage
4d6L           → Ability score generation
2d6+4          → Longsword damage (STR +4)
1d8+3          → Rapier damage (DEX +3)
8d6            → Fireball damage
2d10           → Eldritch Blast (2 beams)
```

## Blades in the Dark (@randsum/blades)

The `@randsum/blades` package implements Forged in the Dark mechanics.

### Action Rolls

Roll a pool of d6s equal to your Action Rating (0-4 dice).

**Results**:
| Highest Die | Outcome |
| ----------- | --------------- |
| 6 | Full Success |
| 4-5 | Partial Success |
| 1-3 | Failure |

**Special Cases**:

- **0 dice**: Roll 2d6, take the lower result
- **Multiple 6s**: Critical success!

### Position & Effect

**Position** (risk level):

- Controlled: Low risk, reduced consequences
- Risky: Standard risk, standard consequences
- Desperate: High risk, severe consequences

**Effect** (impact level):

- Limited: Reduced impact
- Standard: Normal impact
- Great: Increased impact

### Resistance Rolls

Roll dice equal to Attribute rating to resist consequences.
Stress taken = 6 - highest result (minimum 0).

```
3d6    → Action roll (3 dice pool)
2d6    → Standard roll (2 dice pool)
1d6    → Low pool roll
```

## Daggerheart (@randsum/daggerheart)

The `@randsum/daggerheart` package implements Daggerheart's dual-die system.

### Hope & Fear Dice

Roll 2d12 - one Hope die (light), one Fear die (dark).

**Determining Outcome**:

- If Hope die is higher: Player describes outcome (narrative control)
- If Fear die is higher: GM introduces complication or twist
- Ties: GM chooses, but with added narrative element

**Mechanical Success**:
Sum both dice + modifiers, compare to difficulty:

- Meet or exceed = Success
- Below = Failure (but may still progress)

### Stress System

Characters have Stress slots that fill as they take consequences.
When stress overflows, characters become Bloodied or suffer conditions.

```
2d12+3    → Standard action roll with +3 modifier
2d12      → Base action roll
```

## Root RPG (@randsum/root-rpg)

The `@randsum/root-rpg` package implements Powered by the Apocalypse mechanics.

### Basic Moves

Roll 2d6 + relevant stat (-1 to +3).

**Results**:
| Total | Outcome |
| ----- | -------------------- |
| 10+ | Strong Hit (success) |
| 7-9 | Weak Hit (partial) |
| 6- | Miss (GM move) |

### Stats

- **Charm**: Social influence
- **Cunning**: Trickery, deception
- **Finesse**: Dexterity, precision
- **Luck**: Fortune, chance
- **Might**: Strength, force

### Harm & Exhaustion

Characters track:

- **Injury** boxes (physical harm)
- **Exhaustion** boxes (fatigue)
- **Depletion** boxes (resource drain)

```
2d6+2     → Roll with +2 stat modifier
2d6+1     → Roll with +1 stat modifier
2d6       → Roll with +0 modifier
2d6-1     → Roll with -1 modifier
```

## Salvage Union (@randsum/salvageunion)

The `@randsum/salvageunion` package implements roll-under d20 mechanics.

### Core Mechanic

Roll d20 against a target number. Roll equal or under to succeed.

**Critical Results**:

- Natural 1: Critical Success (exceptional outcome)
- Natural 20: Critical Failure (catastrophic outcome)

### Difficulty Modifiers

Target numbers are modified by difficulty:

- Easy: +4 to target
- Standard: No modifier
- Hard: -4 to target
- Very Hard: -8 to target

### Mech Combat

Mechs have:

- **Structure Points (SP)**: Mech health
- **Energy Points (EP)**: Power for systems
- **Heat**: Accumulates from weapon use

```
1d20      → Standard skill check
1d20+4    → Easy check (compare against target+4)
1d20-4    → Hard check (compare against target-4)
```

## Package Installation

All game system packages depend on `@randsum/roller`:

```bash
# Core roller (required)
npm install @randsum/roller

# Game-specific packages
npm install @randsum/fifth        # D&D 5E
npm install @randsum/blades       # Blades in the Dark
npm install @randsum/daggerheart  # Daggerheart
npm install @randsum/root-rpg     # Root RPG
npm install @randsum/salvageunion # Salvage Union
```

## MCP Server

For AI agent integration, use the MCP server which includes all capabilities:

```bash
npm install -g @randsum/mcp
```

Or use directly with npx:

```bash
npx @randsum/mcp --help
```
