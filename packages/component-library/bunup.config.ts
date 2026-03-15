import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  exports: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    '@randsum/roller',
    '@randsum/display-utils',
    '@randsum/notation'
  ],
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true,
  css: {
    inject: true
  }
})
