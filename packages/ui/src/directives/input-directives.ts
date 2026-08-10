import type { App, DirectiveBinding } from 'vue'

function isAllowedEditingKey(event: KeyboardEvent, extraKeys: string[] = []) {
  return [
    'Delete',
    'Backspace',
    'Tab',
    'Esc',
    'Enter',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
    ...extraKeys,
  ].includes(event.key)
    || ((event.ctrlKey || event.metaKey) && ['a', 'c', 'x'].includes(event.key))
}

function isNumberKey(event: KeyboardEvent) {
  return /^\d$/.test(event.key)
}

function isLetterKey(event: KeyboardEvent) {
  return /^[a-z]$/i.test(event.key)
}

export function registerAlphanumericDirective(app: App) {
  app.directive('alphanumeric', {
    created(el: HTMLElement) {
      el.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isAllowedEditingKey(event)) {
          return
        }

        if (!isNumberKey(event) && !isLetterKey(event)) {
          event.preventDefault()
        }
      })
    },
  })
}

export function registerNumericDirective(app: App) {
  app.directive('numeric', {
    created(el: HTMLElement) {
      el.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isAllowedEditingKey(event, ['.'])) {
          return
        }

        if (!isNumberKey(event)) {
          event.preventDefault()
        }
      })
    },
  })
}

export function registerMaxNumberDirective(app: App) {
  app.directive('max-number', {
    updated(el: HTMLElement, binding: DirectiveBinding<number>) {
      const input = el.querySelector('input')
      const maxNumber = binding.value
      const event = new Event('input', { bubbles: true })

      if (input && Number(input.value) > maxNumber) {
        input.value = maxNumber.toString()
        input.dispatchEvent(event)
      }
    },
  })
}

export function registerUppercaseDirective(app: App) {
  app.directive('uppercase', {
    updated(el: HTMLElement) {
      const input = el.querySelector('input')
      const event = new Event('input', { bubbles: true })

      if (input && input.value) {
        input.value = input.value.toUpperCase()
        input.dispatchEvent(event)
      }
    },
  })
}
