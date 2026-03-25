# RANDSUM Bot — Directory Listing Content

Use this content when submitting to top.gg, discordbotlist.com, or similar bot directories.

---

## Bot Name

RANDSUM.io

## Short Description (max 100–150 chars)

Roll dice for D&D, Blades in the Dark, Daggerheart, PbtA, Root RPG, and Salvage Union directly in Discord.

## Long Description

RANDSUM is a fully-featured dice rolling bot for tabletop RPG sessions. Built on the open-source [@randsum/roller](https://github.com/RANDSUM/randsum) library, it supports the full RANDSUM dice notation system and provides dedicated slash commands for six popular game systems.

### Supported Game Systems

- **D&D 5th Edition** (`/fifth`) — d20 + modifier with advantage and disadvantage. Natural 20 highlighted in gold, natural 1 in crimson.
- **Blades in the Dark** (`/blades`) — Action dice pool with critical, success, partial success, and failure outcomes.
- **Daggerheart** (`/dh`) — Hope and fear dice with modifiers, advantage/disadvantage, and die amplification.
- **Powered by the Apocalypse** (`/pbta`) — 2d6 + stat with forward and ongoing bonuses. Miss, weak hit, and strong hit outcomes.
- **Root RPG** (`/root`) — 2d6 + bonus with strong hit, weak hit, and miss resolution.
- **Salvage Union** (`/su`) — d20 table lookups including Core Mechanic and Morale tables.

### Key Features

- **Full notation support** — Roll any combination using RANDSUM dice notation: drop lowest/highest, reroll, explode, cap, and more. Examples: `4d6L`, `2d20H`, `3d8+5`, `4d6!>5`.
- **Detailed breakdowns** — Every result shows individual die values, which dice were kept or dropped, modifiers applied, and the final total.
- **Color-coded embeds** — Outcomes are visually distinct. Critical hits, failures, and special results each have their own color and formatting.
- **Zero configuration** — Add the bot and start rolling immediately. No setup, no permissions fiddling, no configuration commands.
- **Nine slash commands** — All commands are registered as Discord slash commands with autocomplete and inline help.

### Commands

| Command                                                       | Description                                          |
| ------------------------------------------------------------- | ---------------------------------------------------- |
| `/roll notation:<notation>`                                   | Roll any dice using full RANDSUM notation            |
| `/fifth [modifier] [rolling_with]`                            | D&D 5e d20 roll with optional advantage/disadvantage |
| `/blades dice:<n>`                                            | Blades in the Dark action roll                       |
| `/dh [modifier] [rolling_with] [amplify_hope] [amplify_fear]` | Daggerheart hope and fear dice                       |
| `/root [modifier]`                                            | Root RPG 2d6 + modifier                              |
| `/su [table]`                                                 | Salvage Union table roll                             |
| `/pbta stat:<n> [forward] [ongoing] [rolling_with]`           | PbtA 2d6 move roll                                   |
| `/notation`                                                   | Show dice notation reference guide                   |
| `/help`                                                       | List all available commands                          |

### Links

- Landing page: https://randsum.dev/discord
- Documentation: https://randsum.dev/tools/discord-bot/
- Source code: https://github.com/RANDSUM/randsum/tree/main/apps/discord-bot
- Add to server: https://discord.com/oauth2/authorize?client_id=1290434147159904276&permissions=274877906944&scope=bot%20applications.commands

---

## Tags

`dice` `dice-roller` `ttrpg` `dnd` `tabletop` `rpg` `blades-in-the-dark` `daggerheart` `pbta` `root-rpg` `salvage-union` `5e`

## Category

Utility / Fun
