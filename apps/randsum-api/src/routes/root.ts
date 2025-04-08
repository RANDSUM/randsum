/**
 * Handle the root (/) endpoint
 *
 * @returns Response with API documentation
 */
export function handleRootRequest(): Response {
  return new Response(
    JSON.stringify({
      name: 'RANDSUM API',
      version: '0.1.0',
      description: 'API for rolling dice using the RANDSUM dice library',
      endpoints: {
        '/roll': {
          description: 'Roll dice based on query parameters',
          parameters: {
            notation: 'Dice notation string (e.g., "2d20", "4d6L")',
            sides: 'Number of sides on the die (default: 20)',
            quantity: 'Number of dice to roll (default: 1)',
            plus: 'Add a value to the roll total',
            minus: 'Subtract a value from the roll total',
            drop_lowest: 'Drop the lowest N dice',
            drop_highest: 'Drop the highest N dice',
            drop_exact: 'Drop dice with exact values (comma-separated)',
            drop_less_than: 'Drop dice with values less than N',
            drop_greater_than: 'Drop dice with values greater than N',
            reroll_less_than: 'Reroll dice with values less than N',
            reroll_greater_than: 'Reroll dice with values greater than N',
            reroll_exact: 'Reroll dice with exact values (comma-separated)',
            reroll_max: 'Maximum number of rerolls',
            cap_greater_than: 'Cap dice values at a maximum',
            cap_less_than: 'Cap dice values at a minimum',
            unique: 'Ensure all dice have unique values (true/false)'
          },
          examples: [
            '/roll?notation=2d20',
            '/roll?sides=6&quantity=4&drop_lowest=1',
            '/roll?sides=20&quantity=2&plus=5'
          ]
        },
        '/health': {
          description: 'Health check endpoint'
        }
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}
