import {
  describe, it, expect,
} from 'vitest'
import { mount } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { Ref, ComponentPublicInstance } from 'vue'
import LayoutShopHeader from '~/app/layouts/shop/header.vue'
import LoginForm from '~/app/pages/login/_components/login-form.vue'

describe('login', () => {
  it('mounts seller header', async () => {
    const component = await mountSuspended(LayoutShopHeader, {
      global: {
        stubs: {
          NotificationPopover: true,
          ShortcutHint: true,
        },
      },
    })

    expect(component.exists()).toBeTruthy()
  })

  // TODO: test show login dialog

  it('fill email and password input', async () => {
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

  it('alert user input incorrect password', async () => {
    const component = await mountSuspended(LoginForm, {
      global: {
        stubs: {
          NuxtLink: true,
          UAlert: true, // Stub UAlert to ensure it renders even with v-if
        },
      },
    })

    // Define the type for the component instance
    const vm = component.vm as ComponentPublicInstance & {
      unknownErrorServerMsg: Ref<string>
    }

    // Access the internal ref and set its value
    vm.unknownErrorServerMsg.value = 'Incorrect email or password'

    // Wait for the next tick to allow the component to update
    await component.vm.$nextTick()

    expect(component.html()).toContain('Incorrect email or password')
  })

  // TODO: test login success
})
