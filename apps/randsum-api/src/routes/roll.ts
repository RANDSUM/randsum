import { roll } from '@randsum/dice'
import { type DiceNotation, validateNotation } from '@randsum/notation'
import type { RollQueryParams } from '../types'

/**
 * Handle the /roll endpoint
 *
 * @param request - The HTTP request
 * @returns Response with RollResults
 */
export function handleRollRequest(request: Request): Response {
  try {
    const url = new URL(request.url)
    const params: RollQueryParams = {}

    for (const [key, value] of url.searchParams.entries()) {
      params[key as keyof RollQueryParams] = value
    }

    const notation = params.notation ?? '1d20'
    const validationResult = validateNotation(notation)
    if (!validationResult.valid) {
      throw new Error(`Invalid dice notation: ${notation}`)
    }

    return new Response(JSON.stringify(roll(notation as DiceNotation)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error handling roll request:', error)

    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        status: 400
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
