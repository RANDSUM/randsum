// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import rehypePrettyCode from 'rehype-pretty-code'

// https://astro.build/config
export default defineConfig({
  site: 'https://randsum.github.io',
  base: '/randsum',
  output: 'static',
  build: {
    assets: 'assets'
  },
  integrations: [
    mdx({
      syntaxHighlight: false, // We'll use rehype-pretty-code instead
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: {
              dark: 'github-dark',
              light: 'github-light'
            },
            keepBackground: false,
            defaultLang: 'typescript',
            transformers: [
              {
                name: 'add-copy-button',
                code(node) {
                  // Add data attribute for copy functionality
                  node.properties['data-code-block'] = true
                }
              }
            ]
          }
        ]
      ]
    })
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __SITE_TITLE__: JSON.stringify('RANDSUM - Advanced Dice Rolling'),
      __SITE_DESCRIPTION__: JSON.stringify(
        'Professional dice rolling packages for tabletop gaming, with advanced notation support and comprehensive game system integrations.'
      )
    }
  }
})
