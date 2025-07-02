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
  }
] as const
