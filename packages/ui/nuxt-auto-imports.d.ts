/**
 * Ambient declarations for the Nuxt/Nuxt UI auto-imports this package uses.
 *
 * `packages/ui` is compiled inside each Nuxt app, where these globals exist. This
 * file lets the package be typechecked on its own, without pulling an app's
 * generated `.nuxt` types (which would drag app-only auto-imports into the program).
 *
 * Add a declaration here when package code starts using another auto-imported name.
 */
import type * as Vue from 'vue'

declare global {
  type ComputedRef<T = unknown> = Vue.ComputedRef<T>
  type Ref<T = unknown> = Vue.Ref<T>

  interface ImportMeta {
    readonly dev: boolean
  }

  const computed: typeof Vue.computed
  const h: typeof Vue.h
  const nextTick: typeof Vue.nextTick
  const onActivated: typeof Vue.onActivated
  const onBeforeUnmount: typeof Vue.onBeforeUnmount
  const onDeactivated: typeof Vue.onDeactivated
  const onMounted: typeof Vue.onMounted
  const onUnmounted: typeof Vue.onUnmounted
  const ref: typeof Vue.ref
  const toRef: typeof Vue.toRef
  const toValue: typeof Vue.toValue
  const unref: typeof Vue.unref
  const useAttrs: typeof Vue.useAttrs
  const useId: typeof Vue.useId
  const useSlots: typeof Vue.useSlots
  const useTemplateRef: typeof Vue.useTemplateRef
  const watch: typeof Vue.watch
  const watchEffect: typeof Vue.watchEffect

  /**
   * Nuxt UI auto-import. `@nuxt/ui` exposes no importable runtime entry, so the
   * shape mirrors `dist/runtime/composables/useShortcuts.d.ts`.
   */
  const useShortcuts: () => {
    macOS: Vue.ComputedRef<RegExpMatchArray>
    metaSymbol: Vue.Ref<string, string>
    activeElement: Vue.ShallowRef<HTMLElement, HTMLElement>
    usingInput: Vue.ComputedRef<string | boolean>
  }
}
