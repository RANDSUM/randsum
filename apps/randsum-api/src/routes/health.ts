/**
 * Handle the /health endpoint
 *
 * @returns Response with health status
 */
export function handleHealthRequest(): Response {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
