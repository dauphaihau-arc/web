import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { ShippingProfileReadinessLabels } from '@arc/enums/shipping';
import { shippingProfileFormSchema } from '../shipping-profile-form.schema';
import ShippingProfileEditor from './shipping-profile-editor.vue';

vi.mock('~/domains/location/queries/countries.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed } = await import('vue');

  return {
    useGetCountries: () => ({ data: computed(() => ({ data: [] })) }),
  };
});

vi.mock('~/domains/shop/mutations/shipping-profile.mutation', () => ({
  useCreateShippingProfile: () => ({ mutateAsync: vi.fn() }),
  useUpdateShippingProfile: () => ({ mutateAsync: vi.fn() }),
}));

const REQUIRED_NAME_MESSAGE = shippingProfileFormSchema.shape.name.safeParse('').error!.issues[0]!.message;

async function render() {
  const wrapper = await mountSuspended(ShippingProfileEditor);
  const nameInput = wrapper.findAll('input')[0]!;

  return { wrapper, nameInput };
}

describe('shipping profile editor validation', () => {
  it('holds the required name error until the profile is submitted', async () => {
    const { wrapper, nameInput } = await render();

    await nameInput.trigger('blur');
    await flushPromises();

    expect(nameInput.element.value).toBe('');
    expect(wrapper.text()).not.toContain(REQUIRED_NAME_MESSAGE);

    await wrapper.vm.submit();
    await flushPromises();

    expect(wrapper.text()).toContain(REQUIRED_NAME_MESSAGE);
    expect(wrapper.text()).not.toContain('Unable to save');
  });

  it('holds an inverted Processing range until submit, then shows it on the field', async () => {
    const { wrapper } = await render();

    await wrapper.find('[aria-label="Minimum processing days"]').setValue('9');
    await wrapper.find('[aria-label="Maximum processing days"]').setValue('2');
    await flushPromises();

    expect(wrapper.text()).not.toContain(ShippingProfileReadinessLabels.invalid_processing_time);

    await wrapper.vm.submit();
    await flushPromises();

    expect(wrapper.text()).toContain(ShippingProfileReadinessLabels.invalid_processing_time);
    expect(wrapper.emitted('saved')).toBeUndefined();
    expect(wrapper.text()).not.toContain('Unable to save');
  });

  it('leaves the Processing range empty for a new profile instead of prefilling zero days', async () => {
    const { wrapper } = await render();

    expect(wrapper.find<HTMLInputElement>('[aria-label="Minimum processing days"]').element.value).toBe('');
    expect(wrapper.find<HTMLInputElement>('[aria-label="Maximum processing days"]').element.value).toBe('');
    expect(wrapper.find<HTMLInputElement>('[aria-label="Minimum delivery days for rate 1"]').element.value).toBe('');
    expect(wrapper.find<HTMLInputElement>('[aria-label="Maximum delivery days for rate 1"]').element.value).toBe('');
  });

  it('shows a typed postal code in the case the profile stores it', async () => {
    const { wrapper } = await render();
    const postal = wrapper.find<HTMLInputElement>('[name="ship_from_postal"], input[maxlength="20"]');

    await postal.setValue('sw1a 1aa');
    await flushPromises();

    expect(postal.element.value).toBe('SW1A 1AA');
  });

  it('renders an inverted Delivery range instead of failing the save silently', async () => {
    const { wrapper } = await render();

    await wrapper.find('[aria-label="Minimum delivery days for rate 1"]').setValue('5');
    await wrapper.find('[aria-label="Maximum delivery days for rate 1"]').setValue('2');
    await flushPromises();

    await wrapper.vm.submit();
    await flushPromises();

    expect(wrapper.text()).toContain('Delivery time minimum must not exceed the maximum');
    expect(wrapper.emitted('saved')).toBeUndefined();
  });
});
