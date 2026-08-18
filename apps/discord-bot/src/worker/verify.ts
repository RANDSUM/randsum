/**
 * Discord request signature verification.
 *
 * This is the entire security boundary of an HTTP-interactions bot. The
 * endpoint is a public URL that anyone can POST to, so without this check any
 * third party could forge interactions and make the bot say whatever they like
 * in any server it is in. Discord signs every request with Ed25519 and expects
 * a 401 for anything that fails.
 *
 * Implemented against WebCrypto rather than a library: Workers supports Ed25519
 * natively with no compatibility flag, so the dependency would buy nothing.
 *
 * Two properties this must have, both easy to get wrong:
 *
 * 1. **Verify the raw body, never a re-serialized one.** The signature covers
 *    the exact bytes Discord sent. `JSON.parse` followed by `JSON.stringify`
 *    can reorder keys or change number formatting, and the signature then fails
 *    for valid requests — or, worse, someone "fixes" that by skipping the check.
 * 2. **Fail closed.** Any malformed header, bad hex, or thrown error is a
 *    rejection, never a pass. There is no partial credit here.
 */

/** Discord signs `timestamp + rawBody` with the application's public key. */
const ALGORITHM = { name: 'Ed25519' } as const

// Backed by an explicit ArrayBuffer, not the default. `new Uint8Array(n)` is
// typed `Uint8Array<ArrayBufferLike>`, which WebCrypto's `BufferSource` will
// not accept because it could in principle be a SharedArrayBuffer.
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | undefined {
  if (hex.length === 0 || hex.length % 2 !== 0) return undefined
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (const index of bytes.keys()) {
    const byte = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
    if (Number.isNaN(byte)) return undefined
    bytes[index] = byte
  }
  return bytes
}

export interface VerifyInput {
  readonly publicKey: string
  readonly signature: string | null
  readonly timestamp: string | null
  /** The raw request body, exactly as received. */
  readonly rawBody: string
}

/**
 * Returns true only for a request genuinely signed by Discord for this
 * application. Never throws — every failure path returns false.
 */
export async function verifyDiscordRequest(input: VerifyInput): Promise<boolean> {
  const { publicKey, signature, timestamp, rawBody } = input
  if (signature === null || timestamp === null) return false

  const signatureBytes = hexToBytes(signature)
  const publicKeyBytes = hexToBytes(publicKey)
  if (signatureBytes === undefined || publicKeyBytes === undefined) return false

  try {
    const key = await crypto.subtle.importKey('raw', publicKeyBytes, ALGORITHM, false, ['verify'])
    return await crypto.subtle.verify(
      ALGORITHM,
      key,
      signatureBytes,
      new TextEncoder().encode(timestamp + rawBody)
    )
  } catch {
    // A malformed key, an unsupported curve, anything at all — reject.
    return false
  }
}
