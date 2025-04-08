/**
 * Handle 404 for unregistered routes
 *
 * @returns Response with 404 error
 */
export function handleNotFoundRequest(): Response {
  return new Response(JSON.stringify({ error: 'Not Found', status: 404 }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
