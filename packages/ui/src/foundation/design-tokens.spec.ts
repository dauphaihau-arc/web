import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderDesignTokensCss } from '../../scripts/generate-design-tokens.mjs'

const CSS_PATH = fileURLToPath(new URL('./design-tokens.css', import.meta.url))

describe('design tokens', () => {
  it('design-tokens.css matches the generated output from design-tokens.ts', () => {
    expect(readFileSync(CSS_PATH, 'utf8')).toBe(renderDesignTokensCss())
  })
})
