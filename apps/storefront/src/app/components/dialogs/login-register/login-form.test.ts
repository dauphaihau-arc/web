import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mount } from '@vue/test-utils'
import type { ComponentPublicInstance, Ref } from 'vue'
import { describe, expect, it } from 'vitest'
import LoginForm from './login-form.vue'

describe('login form', () => {
  it('fills email and password input', async () => {
    const component = mount(LoginForm, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    const email = 'maimai@gmail.com'
    const password = '123456789'

    const emailInput = component.find('[name="email"]')
    const passwordInput = component.find('[name="password"]')

    await emailInput.setValue(email)
    await passwordInput.setValue(password)

    expect((emailInput.element as HTMLInputElement).value).toBe(email)
    expect((passwordInput.element as HTMLInputElement).value).toBe(password)
  })

  it('alerts user when password is incorrect', async () => {
    const component = await mountSuspended(LoginForm, {
      global: {
        stubs: {
          NuxtLink: true,
          UAlert: true,
        },
      },
    })

    const vm = component.vm as ComponentPublicInstance & {
      unknownErrorServerMsg: Ref<string>
    }

    vm.unknownErrorServerMsg.value = 'Incorrect email or password'

    await component.vm.$nextTick()

    expect(component.html()).toContain('Incorrect email or password')
  })
})
