// One stylesheet for every element: tokens.css then styles.css, adopted into
// each shadow root. Lit shares the constructed sheet across elements.
import { unsafeCSS } from 'lit'
import type { CSSResult } from 'lit'
import styles from '../styles.css' with { type: 'text' }
import tokens from '../tokens.css' with { type: 'text' }

export const sheet: CSSResult = unsafeCSS(
  `${tokens}\n${styles.replace(/^@import '\.\/tokens\.css';\n/m, '')}`
)
