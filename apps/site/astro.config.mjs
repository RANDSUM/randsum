// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://randsum.github.io',
  base: '/randsum',
  output: 'static',
  build: {
    assets: 'assets'
  },
  vite: {
    define: {
      __SITE_TITLE__: JSON.stringify('RANDSUM - Advanced Dice Rolling'),
      __SITE_DESCRIPTION__: JSON.stringify('Professional dice rolling packages for tabletop gaming, with advanced notation support and comprehensive game system integrations.')
    }
  }
});
