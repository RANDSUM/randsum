import { getCollection } from 'astro:content'

export async function getVersions(): Promise<string[]> {
  const entries = await getCollection('specs')
  return entries
    .map(e => e.id)
    .sort((a, b) => {
      const parse = (v: string) => {
        const clean = v.replace(/^v/, '')
        const [numPart = '0', preRelease] = clean.split('-') as [string, string | undefined]
        const [maj = 0, min = 0] = numPart.split('.').map(Number)
        return { maj, min, preRelease }
      }
      const pa = parse(a)
      const pb = parse(b)
      if (pa.maj !== pb.maj) return pa.maj - pb.maj
      if (pa.min !== pb.min) return pa.min - pb.min
      // Pre-release sorts before release (1.0-alpha < 1.0)
      if (pa.preRelease && !pb.preRelease) return -1
      if (!pa.preRelease && pb.preRelease) return 1
      return (pa.preRelease ?? '').localeCompare(pb.preRelease ?? '')
    })
}

export async function getLatestVersion(): Promise<string> {
  const versions = await getVersions()
  const latest = versions[versions.length - 1]
  if (latest === undefined) throw new Error('No spec versions found')
  return latest
}

export async function isLatestVersion(v: string): Promise<boolean> {
  const latest = await getLatestVersion()
  return v === latest
}
