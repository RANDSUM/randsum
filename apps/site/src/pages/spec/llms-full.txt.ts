import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getLatestVersion } from '../../spec/versions'

// The full text of the latest spec, built from the same collection entry the
// site renders, so it cannot fall behind the spec the way a hand copy did.
export const GET: APIRoute = async () => {
  const latest = await getLatestVersion()
  const entry = (await getCollection('specs')).find(e => e.id === latest)
  if (entry?.body === undefined) throw new Error(`No spec body for version: ${latest}`)
  return new Response(entry.body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
