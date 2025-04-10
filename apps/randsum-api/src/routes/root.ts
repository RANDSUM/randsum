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
            notation:
              'Dice notation string (e.g., "2d20", "4d6L". See https://github.com/RANDSUM/randsum/blob/main/packages/notation/RANDSUM_DICE_NOTATION.md)'
          },
          examples: ['/roll?notation=2d20']
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
