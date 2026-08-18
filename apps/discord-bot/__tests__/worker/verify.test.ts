/**
 * Covers the Discord request signature check.
 *
 * This is the whole security boundary of an HTTP-interactions bot: the endpoint
 * is a public URL, so anything that gets past this can make the bot post
 * arbitrary content in every server it is in. The tests therefore lean on the
 * rejection paths rather than the happy one — a verifier that accepts valid
 * requests but also accepts forged ones passes a naive test suite and is
 * completely broken.
 *
 * Signatures are generated with real WebCrypto Ed25519 keys rather than
 * fixtures, so these exercise the same primitives the Worker uses.
 */
import { describe, expect, test } from 'bun:test'
import { verifyDiscordRequest } from '../../src/worker/verify.js'

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Narrows generateKey's union without a cast. */
function isKeyPair(key: CryptoKey | CryptoKeyPair): key is CryptoKeyPair {
  return 'privateKey' in key
}

async function makeSignedRequest(body: string, timestamp = '1700000000') {
  // The string form, not `{ name: 'Ed25519' }` — the object form resolves to
  // the overload returning a single CryptoKey, and the pair is what we need.
  const generated = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
  if (!isKeyPair(generated)) throw new Error('expected Ed25519 to generate a key pair')
  const pair = generated

  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    pair.privateKey,
    new TextEncoder().encode(timestamp + body)
  )
  const publicKey = await crypto.subtle.exportKey('raw', pair.publicKey)

  return {
    publicKey: toHex(publicKey),
    signature: toHex(signature),
    timestamp,
    rawBody: body
  }
}

describe('verifyDiscordRequest', () => {
  test('accepts a genuinely signed request', async () => {
    const input = await makeSignedRequest('{"type":1}')
    expect(await verifyDiscordRequest(input)).toBe(true)
  })

  test('rejects a tampered body', async () => {
    const input = await makeSignedRequest('{"type":1}')
    // The exact attack this exists to stop: valid signature, different payload.
    expect(await verifyDiscordRequest({ ...input, rawBody: '{"type":2}' })).toBe(false)
  })

  test('rejects a tampered timestamp', async () => {
    const input = await makeSignedRequest('{"type":1}')
    expect(await verifyDiscordRequest({ ...input, timestamp: '1700000001' })).toBe(false)
  })

  test('rejects a signature from a different key', async () => {
    const mine = await makeSignedRequest('{"type":1}')
    const theirs = await makeSignedRequest('{"type":1}')
    // Someone else's valid signature must not verify against our public key.
    expect(await verifyDiscordRequest({ ...mine, signature: theirs.signature })).toBe(false)
  })

  test('rejects a missing signature or timestamp', async () => {
    const input = await makeSignedRequest('{"type":1}')
    expect(await verifyDiscordRequest({ ...input, signature: null })).toBe(false)
    expect(await verifyDiscordRequest({ ...input, timestamp: null })).toBe(false)
  })

  test('rejects malformed hex rather than throwing', async () => {
    const input = await makeSignedRequest('{"type":1}')
    // Fails closed: garbage input is a rejection, never an exception that a
    // caller might catch and treat as "couldn't check, carry on".
    expect(await verifyDiscordRequest({ ...input, signature: 'zzzz' })).toBe(false)
    expect(await verifyDiscordRequest({ ...input, signature: 'abc' })).toBe(false)
    expect(await verifyDiscordRequest({ ...input, publicKey: 'nonsense' })).toBe(false)
    expect(await verifyDiscordRequest({ ...input, signature: '' })).toBe(false)
  })

  test('rejects an empty-string public key', async () => {
    const input = await makeSignedRequest('{"type":1}')
    // An unset DISCORD_PUBLIC_KEY env var arrives as '' — that must reject
    // everything, not accept everything.
    expect(await verifyDiscordRequest({ ...input, publicKey: '' })).toBe(false)
  })
})
