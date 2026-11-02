// Each product's pages share that product's social card (public/og/<product>.png);
// every other page keeps the family card that astro.config.mjs sets.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import { PRODUCT_LABELS, PRODUCTS, productForPath } from './utils/product'

const IMAGE_KEYS = new Set(['og:image', 'twitter:image'])
const ALT_KEY = 'og:image:alt'

export const onRequest: ReturnType<typeof defineRouteMiddleware> = defineRouteMiddleware(
  context => {
    const product = productForPath(context.url.pathname)
    if (!product) return
    const image = new URL(`/og/${product}.png`, context.site).href
    const tagline = PRODUCTS.find(info => info.id === product)?.tagline
    const alt = `RANDSUM ${PRODUCT_LABELS[product]}${tagline ? `: ${tagline}` : ''}`
    for (const entry of context.locals.starlightRoute.head) {
      const key = entry.attrs?.['property'] ?? entry.attrs?.['name']
      if (entry.tag !== 'meta' || typeof key !== 'string') continue
      if (IMAGE_KEYS.has(key)) entry.attrs = { ...entry.attrs, content: image }
      if (key === ALT_KEY) entry.attrs = { ...entry.attrs, content: alt }
    }
  }
)
