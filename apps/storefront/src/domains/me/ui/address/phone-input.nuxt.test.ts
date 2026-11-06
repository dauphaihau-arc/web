import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import PhoneInput from './phone-input.vue';

describe('phone input', () => {
  it('shows the dial code supplied by the selected country', async () => {
    const wrapper = await mountSuspended(PhoneInput, {
      props: { countryCode: 'GB', modelValue: '' },
    });

    expect(wrapper.text()).toContain('+44');
    expect(wrapper.find('input').attributes('type')).toBe('tel');
  });

  it('converts a typed local number to E.164 for the selected country', async () => {
    const wrapper = await mountSuspended(PhoneInput, {
      props: { countryCode: 'US', modelValue: '' },
    });

    await wrapper.find('input').setValue('415 555 2671');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['+14155552671']);
  });

  it('drops the national trunk prefix when localizing an international number', async () => {
    const wrapper = await mountSuspended(PhoneInput, {
      props: { countryCode: 'GB', modelValue: '' },
    });

    await wrapper.find('input').setValue('020 7946 0958');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['+442079460958']);
  });

  it('keeps a pasted international number as entered', async () => {
    const wrapper = await mountSuspended(PhoneInput, {
      props: { countryCode: 'US', modelValue: '' },
    });

    await wrapper.find('input').setValue('+44 20 7946 0958');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['+44 20 7946 0958']);
  });

  it('displays only the national portion of an E.164 value', async () => {
    const wrapper = await mountSuspended(PhoneInput, {
      props: { countryCode: 'US', modelValue: '+14155552671' },
    });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('4155552671');
  });

  it('updates the dial code when the selected country changes', async () => {
    const wrapper = await mountSuspended(PhoneInput, {
      props: { countryCode: 'US', modelValue: '4155552671' },
    });

    expect(wrapper.text()).toContain('+1');

    await wrapper.setProps({ countryCode: 'GB' });

    expect(wrapper.text()).toContain('+44');
  });

  it('leaves an untouched legacy value untouched', async () => {
    const wrapper = await mountSuspended(PhoneInput, {
      props: { countryCode: 'US', modelValue: '0900000000' },
    });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0900000000');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('reserves leading padding for three- and four-character dial codes', async () => {
    const vietnam = await mountSuspended(PhoneInput, {
      props: { countryCode: 'VN', modelValue: '' },
      attrs: { size: 'lg' },
    });
    const albania = await mountSuspended(PhoneInput, {
      props: { countryCode: 'AL', modelValue: '' },
      attrs: { size: 'lg' },
    });

    expect(vietnam.text()).toContain('🇻🇳');
    expect(vietnam.text()).toContain('+84');
    expect((vietnam.find('input').element as HTMLInputElement).style.paddingInlineStart)
      .toBe('4.5rem');
    expect(albania.text()).toContain('🇦🇱');
    expect(albania.text()).toContain('+355');
    expect((albania.find('input').element as HTMLInputElement).style.paddingInlineStart)
      .toBe('4.75rem');
  });
});
