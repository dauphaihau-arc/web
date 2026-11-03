/**
 * Generates `src/foundation/design-tokens.css` from `src/foundation/design-tokens.ts`.
 *
 * The TS module is the single source of truth: every CSS custom property in the
 * `:root` block is derived from `designColors` / `designRadii` / `designShadows` /
 * `designLayout`. `design-tokens.spec.ts` asserts the committed file matches this
 * renderer, so drift is a test failure rather than a silent divergence.
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

/** Rules that are not token definitions; they only consume the generated custom properties. */
const STATIC_RULES = `.max-w-home-layout {
  max-width: var(--layout-max-width-home);
}

.max-w-shop-layout {
  max-width: var(--layout-max-width-shop);
}

.w-shop-layout-sidebar {
  width: var(--layout-shop-sidebar-width);
}

.w-shop-layout-content {
  width: calc(100% - var(--layout-shop-sidebar-width));
  max-width: var(--layout-shop-content-max-width);
}

.shop-layout-content-inner {
  width: 100%;
  padding-left: var(--layout-page-gutter);
  padding-right: var(--layout-page-gutter);
}

.bg-layout-shop {
  background-image: var(--layout-shop-background);
}

.shadow-border {
  box-shadow: var(--shadow-border);
}

.shadow-overlay {
  box-shadow: var(--shadow-overlay);
}

.shadow-hero {
  box-shadow: var(--shadow-hero);
}

.scrollbar-subtle {
  scrollbar-width: thin;
  scrollbar-color: rgb(180 180 180) transparent;
}

.scrollbar-subtle::-webkit-scrollbar {
  width: 10px;
  background: inherit;
}

.scrollbar-subtle::-webkit-scrollbar-track {
  background: inherit;
  border: 0;
}

.scrollbar-subtle::-webkit-scrollbar-thumb {
  background-color: rgb(180 180 180);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

/* Scrolls without showing a scrollbar; for edge-bleeding horizontal strips
   whose cut-off content already signals there is more to reach. */
.scrollbar-hidden {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}

@property --scroll-fade-top {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0;
}

@property --scroll-fade-bottom {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0;
}

@property --scroll-fade-left {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0;
}

@property --scroll-fade-right {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 0;
}

.scroll-fade,
.scroll-fade-y {
  --scroll-fade-size: min(12%, 40px);
  --scroll-fade-top: 0;
  --scroll-fade-bottom: var(--scroll-fade-size);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    black var(--scroll-fade-top),
    black calc(100% - var(--scroll-fade-bottom)),
    transparent
  );
  mask-image: linear-gradient(
    to bottom,
    transparent,
    black var(--scroll-fade-top),
    black calc(100% - var(--scroll-fade-bottom)),
    transparent
  );
}

.scroll-fade-x {
  --scroll-fade-size: min(12%, 40px);
  --scroll-fade-left: 0;
  --scroll-fade-right: var(--scroll-fade-size);
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black var(--scroll-fade-left),
    black calc(100% - var(--scroll-fade-right)),
    transparent
  );
  mask-image: linear-gradient(
    to right,
    transparent,
    black var(--scroll-fade-left),
    black calc(100% - var(--scroll-fade-right)),
    transparent
  );
}

@supports (animation-timeline: scroll()) {
  .scroll-fade,
  .scroll-fade-y {
    animation: scroll-fade-y linear both;
    animation-timeline: scroll(self y);
  }

  .scroll-fade-x {
    animation: scroll-fade-x linear both;
    animation-timeline: scroll(self x);
  }
}

@keyframes scroll-fade-y {
  0% {
    --scroll-fade-top: 0;
    --scroll-fade-bottom: var(--scroll-fade-size);
  }

  8%,
  92% {
    --scroll-fade-top: var(--scroll-fade-size);
    --scroll-fade-bottom: var(--scroll-fade-size);
  }

  100% {
    --scroll-fade-top: var(--scroll-fade-size);
    --scroll-fade-bottom: 0;
  }
}

@keyframes scroll-fade-x {
  0% {
    --scroll-fade-left: 0;
    --scroll-fade-right: var(--scroll-fade-size);
  }

  8%,
  92% {
    --scroll-fade-left: var(--scroll-fade-size);
    --scroll-fade-right: var(--scroll-fade-size);
  }

  100% {
    --scroll-fade-left: var(--scroll-fade-size);
    --scroll-fade-right: 0;
  }
}
`;

/** Returns the complete stylesheet: generated `:root` block plus the static rules. */
export function renderDesignTokensCss() {
  return `:root {\n${renderVarBlock()}\n}\n\n${STATIC_RULES}`;
}

const runAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (runAsScript) {
  writeFileSync(CSS_PATH, renderDesignTokensCss());
  console.info(`Generated ${CSS_PATH}`);
}
