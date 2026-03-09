function hexToRgb(hex: string): readonly [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff] as const
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

/**
 * Linearly interpolate between two hex colors.
 * @param start - Hex color at t=0 (e.g. '#3b82f6')
 * @param end   - Hex color at t=1 (e.g. '#93c5fd')
 * @param t     - Interpolation factor, 0–1
 */
export function lerpColor(start: string, end: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(start)
  const [r2, g2, b2] = hexToRgb(end)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
