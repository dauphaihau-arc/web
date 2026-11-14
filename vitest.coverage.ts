/**
 * Shared Vitest coverage settings for the app configs.
 *
 * Coverage is opt-in: pass `--coverage` (or run the `test:coverage` scripts) so
 * normal test runs stay fast. Each config writes its own directory, so the unit
 * and Nuxt runs of one app never overwrite each other's reports.
 */
export function coverageConfig(reportsDirectory: string) {
  return {
    provider: 'v8' as const,
    reporter: ['text', 'html', 'lcov'],
    reportsDirectory,
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.nuxt.test.{ts,tsx}',
      'src/**/*.d.ts',
      // v8 cannot remap SFC source in this setup, so loaded `.vue` files are
      // dropped with a parse warning; exclude them rather than report noise.
      'src/**/*.vue',
    ],
  };
}
