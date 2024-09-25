import type { Options } from 'tsup'

export const tsup: Options = {
  entry: ['src/index.ts'],
  format: [ 'esm'],
  dts: true,
  clean: true,
}
