import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
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
  splitting: false,
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true,
  css: {
    inject: true
  }
})
