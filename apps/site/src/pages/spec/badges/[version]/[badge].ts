import type { APIRoute, GetStaticPaths } from 'astro'
import theme from '../../../../styles/theme.css?raw'
import { getVersions } from '../../../../spec/versions'
import { LEVELS, type Level, badgeSvg, themeColour } from '../../../../spec/badges'

// /spec/badges/v0.9.0/level-2.svg: one badge per spec version and level
export const getStaticPaths: GetStaticPaths = async () => {
  const versions = await getVersions()
  return versions.flatMap(version =>
    LEVELS.map(level => ({
      params: { version: `v${version}`, badge: `level-${level.level}.svg` },
      props: { version, level }
    }))
  )
}

export const GET: APIRoute<{ version: string; level: Level }> = ({ props }) =>
  new Response(
    badgeSvg(props.version, props.level, {
      label: themeColour(theme, '--rs-gray-2'),
      message: themeColour(theme, '--product-spec'),
      text: themeColour(theme, '--rs-paper')
    }),
    { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } }
  )
