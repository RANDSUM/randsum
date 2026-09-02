/**
 * The attribution half of the footer line.
 *
 * Components V2 has no footer primitive — the line is composed by hand as `-#`
 * subtext — and every roll prefixes it with that roll's derivation, so the
 * constant is the attribution alone rather than the whole string.
 *
 * This replaced `embedFooterDetails`, which was the identical string applied by
 * hand in nine command files and omitted from the tenth surface entirely (the
 * error response). It went when the last embed renderer did.
 */
export const FOOTER_ATTRIBUTION = 'rolled with 👹 by randsum.dev'
