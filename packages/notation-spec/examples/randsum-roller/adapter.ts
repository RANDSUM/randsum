// The RDN conformance adapter for @randsum/roller, the reference implementation:
//
//   rdn-conformance -- bun examples/randsum-roller/adapter.ts
//
// One JSON request per line in on stdin, one JSON response per line out on stdout.
import { createInterface } from 'node:readline'
import type { VectorRequest } from '../../src/runner'
import { evaluate } from './evaluate'

for await (const line of createInterface({ input: process.stdin })) {
  if (line.trim() === '') continue
  const request = JSON.parse(line) as VectorRequest
  process.stdout.write(`${JSON.stringify(evaluate(request))}\n`)
}
