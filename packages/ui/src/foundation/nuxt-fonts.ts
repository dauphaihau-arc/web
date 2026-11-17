import { fileURLToPath } from 'node:url'

/**
 * Nuxt Fonts configuration shared by seller, admin and storefront.
 *
 * The WOFF2 files live next to this module and are loaded through the `local`
 * provider (`local.dirs`), which emits them as build assets served from the app
 * origin. `public/` scanning is not used because that would duplicate the files
 * into every app.
 *
 * Filenames carry family, weight range and subset for the local provider:
 * `plus-jakarta-sans-200-800-latin.woff2`, `sora-100-800-latin.woff2`.
 * Body copy is not listed: it keeps Tailwind's system `sans` stack.
 *
 * The local provider does not emit `unicode-range`, so Latin and Vietnamese
 * cannot be shipped as two faces of the same family: the later face would win
 * for every character. The Plus Jakarta Sans file is therefore subset once to
 * the union of both ranges (620 glyphs, `wght` 200–800) under the single
 * `latin` subset token the filename parser understands.
 */
const fontsDir = fileURLToPath(new URL('./fonts', import.meta.url))

export const sharedFonts = {
  local: {
    dirs: [fontsDir],
  },
  families: [
    {
      name: 'Sora',
      weights: ['100 800'],
      subsets: ['latin'],
      preload: { subsets: ['latin'], weights: [700] },
    },
    {
      name: 'Plus Jakarta Sans',
      weights: ['200 800'],
      subsets: ['latin'],
      preload: { subsets: ['latin'], weights: [600] },
    },
  ],
}
