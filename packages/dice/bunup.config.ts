export default {
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  minify: true,
  clean: false,
  splitting: true,
  sourcemap: 'inline',
  target: 'node'
}
