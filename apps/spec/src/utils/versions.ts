import { getCollection } from 'astro:content'

export async function getVersions(): Promise<string[]> {
  const entries = await getCollection('specs')
  return entries
    .map(e => e.id)
    .sort((a, b) => {
      const toNum = (v: string) => v.replace(/^v/, '').split('.').map(Number)
      const [aMaj = 0, aMin = 0] = toNum(a)
      const [bMaj = 0, bMin = 0] = toNum(b)
      if (aMaj !== bMaj) return aMaj - bMaj
      return aMin - bMin
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
