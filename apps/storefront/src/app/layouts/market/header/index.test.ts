import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import LayoutMarketHeader from './index.vue'

describe('market header', () => {
  it('shows the cart mega menu overlay', async () => {
    const component = await mountSuspended(LayoutMarketHeader)

    await component.find('#cart-btn').trigger('click')
    await nextTick()
    await flushPromises()

    expect(component.find('.overlay').exists()).toBeTruthy()
  })
})
