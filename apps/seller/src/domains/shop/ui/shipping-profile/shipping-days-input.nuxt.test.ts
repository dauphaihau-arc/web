import {
  describe, expect, it,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import ShippingDaysInput from './shipping-days-input.vue';

async function render(props: Record<string, unknown> = {}) {
  const wrapper = await mountSuspended(ShippingDaysInput, {
    props: { label: 'Minimum processing days', ...props },
  });

  return { wrapper, input: wrapper.find('input') };
}

describe('shipping days input', () => {
  it('keeps only whole days from typed input', async () => {
    const { wrapper, input } = await render();

    await input.setValue('2.5');
    await flushPromises();

    expect(input.element.value).toBe('2');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([2]);
  });

  it('drops a negative sign instead of storing a negative day count', async () => {
    const { wrapper, input } = await render();

    await input.setValue('-5');
    await flushPromises();

    expect(input.element.value).toBe('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('drops leading zeros instead of showing them', async () => {
    const { wrapper, input } = await render();

    await input.setValue('03');
    await flushPromises();

    expect(input.element.value).toBe('3');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3]);
  });

  it('emits nothing for a cleared field so an absent range stays valid', async () => {
    const { wrapper, input } = await render({ modelValue: 3 });

    await input.setValue('');
    await flushPromises();

    expect(input.element.value).toBe('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('clamps to the allowed range on blur', async () => {
    const { wrapper, input } = await render({ max: 30 });

    await input.setValue('99');
    await input.trigger('blur');
    await flushPromises();

    expect(input.element.value).toBe('30');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([30]);
  });

  it('follows an externally replaced value', async () => {
    const { wrapper, input } = await render({ modelValue: 1 });

    await wrapper.setProps({ modelValue: 7 });
    await flushPromises();

    expect(input.element.value).toBe('7');
  });
});
