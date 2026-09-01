import { describe, expect, it } from 'vitest'
import type { App, ObjectDirective } from 'vue'
import { registerSkuDirective } from './input-directives'

describe('registerSkuDirective', () => {
  it('allows letters, numbers, hyphen, and editing keys only', () => {
    const directive = getRegisteredDirective()
    const el = new EventTarget() as HTMLElement

    directive.created?.(el, undefined as never, undefined as never, undefined as never)

    expect(isBlocked(el, 'A')).toBe(false)
    expect(isBlocked(el, '1')).toBe(false)
    expect(isBlocked(el, '-')).toBe(false)
    expect(isBlocked(el, 'Backspace')).toBe(false)
    expect(isBlocked(el, '/')).toBe(true)
    expect(isBlocked(el, ' ')).toBe(true)
  })
})

function getRegisteredDirective() {
  let directive: ObjectDirective | undefined
  const app = {
    directive(name: string, registeredDirective: ObjectDirective) {
      if (name === 'sku') {
        directive = registeredDirective
      }

      return app as App
    },
  } as App

  registerSkuDirective(app)

  if (!directive) {
    throw new Error('SKU directive was not registered')
  }

  return directive
}

function isBlocked(el: HTMLElement, key: string) {
  const event = new Event('keydown', { cancelable: true })
  Object.defineProperty(event, 'key', { value: key })

  el.dispatchEvent(event)

  return event.defaultPrevented
}
