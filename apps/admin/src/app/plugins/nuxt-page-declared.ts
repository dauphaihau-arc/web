/**
 * Silences two dev-only Nuxt false positives caused by the backend-ready gate in `src/app.vue`:
 *
 * - `nuxt/dist/pages/runtime/plugins/check-if-page-unused` warns when pages exist but
 *   `<NuxtPage />` was seemingly never used.
 * - `nuxt/dist/app/plugins/check-if-layout-used` warns when layouts exist but `<NuxtLayout />`
 *   was seemingly never used.
 *
 * Both judge usage from a flag set only inside the component's own `setup()` — `_isNuxtPageUsed`
 * in `pages/runtime/page.js`, `_isNuxtLayoutUsed` in `app/components/nuxt-layout.js`. `src/app.vue`
 * renders `<NuxtLayout><NuxtPage /></NuxtLayout>` behind `v-else-if="isReady"`, because pages must
 * not mount before the API is awake. On the first render the gate is false and the splash shows
 * instead, so the checks (server: `app:rendered`; client: `onNuxtReady`) run before either
 * component is instantiated and report false positives.
 *
 * Both components are in fact used — they are the app's root layout and router view — so declare
 * them here. This touches private Nuxt fields; if a Nuxt upgrade renames them, the warnings simply
 * return and nothing else breaks.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev) {
    nuxtApp._isNuxtPageUsed = true;
    nuxtApp._isNuxtLayoutUsed = true;
  }
});
