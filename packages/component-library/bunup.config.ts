import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true,
  css: {
    inject: true
  }
})
