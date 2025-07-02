export function log(message: string, verbose = false): void {
  if (verbose || process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] ${message}`)
  }
}
