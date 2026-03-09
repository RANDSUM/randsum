import { execFile } from 'node:child_process'

export function openUrl(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  execFile(cmd, [url])
}
