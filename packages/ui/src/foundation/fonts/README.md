# Vendored fonts

Consumed by `../nuxt-fonts.ts` through the `@nuxt/fonts` local provider.
Body copy stays on the system stack; these files serve `font-brand` (Sora) and
`font-heading` (Plus Jakarta Sans, inside `.layout-content`).

| File | Family | Axis | Coverage |
|---|---|---|---|
| `sora-100-800-latin.woff2` | Sora | `wght 100 800` | Latin |
| `plus-jakarta-sans-200-800-latin.woff2` | Plus Jakarta Sans | `wght 200 800` | Latin + Vietnamese |

Licences: `OFL-sora.txt`, `OFL-plus-jakarta-sans.txt` (SIL OFL 1.1).

## Regenerating

Sora comes as-is from `@fontsource-variable/sora@5.3.0`
(`files/sora-latin-wght-normal.woff2`).

Plus Jakarta Sans is subset once from the Google Fonts variable source. The
local provider emits no `unicode-range`, so two faces of the same family would
overwrite each other; the Latin and Vietnamese ranges must live in one file.

```bash
curl -fsSL -o /tmp/PlusJakartaSans.ttf \
  'https://github.com/google/fonts/raw/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf'

pyftsubset /tmp/PlusJakartaSans.ttf \
  --unicodes='U+0000-02FF,U+0300-0309,U+0323,U+0329,U+1D00-1DBF,U+1E00-1EFF,U+2000-206F,U+20A0-20C0,U+2113,U+2122,U+2191,U+2193,U+2212,U+2215,U+2C60-2C7F,U+A720-A7FF,U+FEFF,U+FFFD' \
  --flavor=woff2 --layout-features='*' \
  --output-file=plus-jakarta-sans-200-800-latin.woff2
```

Requires `fonttools` with `brotli`. Verify before committing:

```bash
python - <<'PY'
from fontTools.ttLib import TTFont
f = TTFont('plus-jakarta-sans-200-800-latin.woff2')
print([(a.axisTag, a.minValue, a.maxValue) for a in f['fvar'].axes])
cmap = f.getBestCmap()
print(sorted({c for c in 'Chiến lược bán hàng trên Shopee' if c != ' ' and ord(c) not in cmap}))
PY
```

A clean build is required after replacing a font file: Nuxt copies the emitted
asset during build and an incremental build can keep the previous content.

```bash
pnpm --filter @arc/storefront exec nuxi cleanup
pnpm --filter @arc/storefront build
```
