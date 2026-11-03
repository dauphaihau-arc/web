import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import colors from 'tailwindcss/colors'
import { describe, expect, it } from 'vitest'
import { renderDesignTokensCss } from '../../scripts/generate-design-tokens.mjs'
import { sharedAppConfig } from './app-config'
import { designColors } from './design-tokens'

const CSS_PATH = fileURLToPath(new URL('./design-tokens.css', import.meta.url))

describe('design tokens', () => {
  it('design-tokens.css matches the generated output from design-tokens.ts', () => {
    expect(readFileSync(CSS_PATH, 'utf8')).toBe(renderDesignTokensCss())
  })

  it('keeps semantic colors pinned to the zinc ramp Nuxt UI resolves at runtime', () => {
    // Nuxt UI injects --color-gray-50..950 from `ui.gray` using Tailwind's palette,
    // and its own components (UButton/UInput/...) resolve `gray` against it, so these
    // tokens must track zinc exactly; changing `ui.gray` or a zinc hex has to fail here.
    expect(sharedAppConfig.ui.gray).toBe('zinc')

    expect(designColors.border.muted.toLowerCase()).toBe(colors.zinc[300])
    expect(designColors.border.subtle.toLowerCase()).toBe(colors.zinc[200])
    expect(designColors.border.hover.toLowerCase()).toBe(colors.zinc[400])

    expect(designColors.surface.control.toLowerCase()).toBe(colors.zinc[200])
    expect(designColors.surface.muted.toLowerCase()).toBe(colors.zinc[100])
    expect(designColors.surface.subtle.toLowerCase()).toBe(colors.zinc[50])

    expect(designColors.text.muted.toLowerCase()).toBe(colors.zinc[500])
    expect(designColors.text.subtle.toLowerCase()).toBe(colors.zinc[600])
    expect(designColors.text.strong.toLowerCase()).toBe(colors.zinc[900])
    expect(designColors.text['on-dark'].toLowerCase()).toBe(colors.zinc[300])
  })

  it('keeps every color key kebab-case so Tailwind emits a matching utility', () => {
    // Tailwind derives class names from the key verbatim: `onDark` emits
    // `.text-text-onDark`, silently leaving `text-text-on-dark` unstyled.
    const camel = /[A-Z]/
    const offenders: string[] = []

    const walk = (node: unknown, path: string[]) => {
      if (typeof node === 'string') {
        return
      }

      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (key !== 'DEFAULT' && camel.test(key)) {
          offenders.push([...path, key].join('.'))
        }
        walk(value, [...path, key])
      }
    }

    walk(designColors, [])
    expect(offenders).toEqual([])
  })
})
