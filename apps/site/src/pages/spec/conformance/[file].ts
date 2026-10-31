import type { APIRoute, GetStaticPaths } from 'astro'
import schema from '@randsum/notation-spec/schema/conformance.schema.json?raw'
import v090 from '@randsum/notation-spec/vectors/v0.9.0.json?raw'

// notation.randsum.dev/conformance/v0.9.0.json and the schema it names, served
// verbatim from @randsum/notation-spec, the source of truth. Each file's $id is
// that URL. Built under /spec/ like every spec page (src/spec/urls.ts).
const FILES: Record<string, string> = {
  'v0.9.0.json': v090,
  'conformance.schema.json': schema
}

export const getStaticPaths: GetStaticPaths = () =>
  Object.entries(FILES).map(([file, body]) => ({ params: { file }, props: { body } }))

export const GET: APIRoute<{ body: string }> = ({ props }) =>
  new Response(props.body, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
