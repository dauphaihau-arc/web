/**
 * Generates `src/foundation/design-tokens.css` from `src/foundation/design-tokens.ts`.
 *
 * The TS module is the single source of truth: every CSS custom property in the
 * `:root` block is derived from `designColors` / `designRadii` / `designShadows` /
 * `designLayout`. `design-tokens.spec.ts` asserts the committed file matches this
 * renderer, so drift is a test failure rather than a silent divergence.
 *
 * The output is the token layer only — consuming rules belong in `layout.css`,
 * `elevation.css` and `scroll.css`, which are hand-written.
 *
 * Usage: `node --experimental-strip-types packages/ui/scripts/generate-design-tokens.mjs`
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  designColors,
  designLayout,
  designRadii,
  designShadows,
} from '../src/foundation/design-tokens.ts';

const CSS_PATH = fileURLToPath(new URL('../src/foundation/design-tokens.css', import.meta.url));

/** `overlayDark` -> `overlay-dark`, `onDark` -> `on-dark`. */
const toKebab = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Flattens nested color objects into `[name, value]` pairs (`DEFAULT` emits a `-default` step). */
function flattenColors(node, path = []) {
  return Object.entries(node).flatMap(([key, value]) => {
    const nextPath = [...path, toKebab(key)];
    if (typeof value === 'string') {
      return [[nextPath.join('-'), value]];
    }
    return flattenColors(value, nextPath);
  });
}

/**
 * Layout var suffixes are a fixed public API; keep the existing names stable
 * (`layoutShopBackground` -> `--layout-shop-background`, not `--layout-layout-shop-background`).
 */
const LAYOUT_VAR_NAMES = {
  maxWidthHome: 'max-width-home',
  maxWidthShop: 'max-width-shop',
  shopSidebarWidth: 'shop-sidebar-width',
  shopContentMaxWidth: 'shop-content-max-width',
  pageGutter: 'page-gutter',
  layoutShopBackground: 'shop-background',
};

function renderVarBlock() {
  const colors = flattenColors(designColors).map(
    ([name, value]) => `  --${name}: ${value.toLowerCase()};`,
  );
  const radii = Object.entries(designRadii).map(
    ([name, value]) => `  --radius-${toKebab(name)}: ${value.toLowerCase()};`,
  );
  const shadows = Object.entries(designShadows).map(
    ([name, value]) => `  --shadow-${toKebab(name)}: ${value.toLowerCase()};`,
  );
  const layout = Object.entries(designLayout).map(
    ([name, value]) => `  --layout-${LAYOUT_VAR_NAMES[name]}: ${value.toLowerCase()};`,
  );

  return [colors, radii, shadows, layout].map((group) => group.join('\n')).join('\n\n');
}

/**
 * Returns the generated stylesheet: the `:root` custom-property block only.
 * Rules that consume these tokens live in `layout.css`, `elevation.css` and
 * `scroll.css`, so this file stays a pure token layer.
 */
export function renderDesignTokensCss() {
  return `:root {\n${renderVarBlock()}\n}\n`;
}

const runAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (runAsScript) {
  writeFileSync(CSS_PATH, renderDesignTokensCss());
  console.info(`Generated ${CSS_PATH}`);
}
