export const toolDefinitions = [
  {
    name: 'roll',
    description: 'Roll dice using RANDSUM notation (e.g., "2d20+5", "4d6L")',
    inputSchema: {
      type: 'object',
      properties: {
        notation: {
          type: 'string',
          description: 'Dice notation string (e.g., "2d20+5", "4d6L", "3d8!")'
        }
      },
      required: ['notation']
    }
  },
  {
    name: 'validate-notation',
    description: 'Validate dice notation and get helpful feedback',
    inputSchema: {
      type: 'object',
      properties: {
        notation: {
          type: 'string',
          description: 'Dice notation string to validate'
        }
      },
      required: ['notation']
    }
  },
  {
    name: 'game-roll',
    description:
      'Roll dice using game-specific mechanics (5e, Blades, Daggerheart, Salvage Union)',
    inputSchema: {
      type: 'object',
      properties: {
        game: {
          type: 'string',
          enum: ['5e', 'blades', 'daggerheart', 'salvageunion'],
          description: 'Game system to use for rolling'
        },
        modifier: {
          type: 'number',
          description: 'Modifier to add to the roll (for 5e and Daggerheart)'
        },
        rollingWith: {
          type: 'string',
          enum: ['Advantage', 'Disadvantage'],
          description:
            'Roll with advantage or disadvantage (5e and Daggerheart)'
        },
        dicePool: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Number of dice in pool (for Blades in the Dark)'
        },
        tableName: {
          type: 'string',
          description:
            'Table name for Salvage Union rolls (e.g., "Core Mechanic", "Critical Damage")'
        },
        dc: {
          type: 'number',
          minimum: 1,
          maximum: 30,
          description:
            'Difficulty Class to check against (optional, for 5e and Daggerheart)'
        }
      },
      required: ['game']
    }
  }
] as const
