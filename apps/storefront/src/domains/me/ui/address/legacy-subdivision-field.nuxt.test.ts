import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import LegacySubdivisionField from './legacy-subdivision-field.vue';

describe('legacy subdivision field', () => {
  it('shows the preserved legacy value with an explicit replacement action', async () => {
    const wrapper = await mountSuspended(LegacySubdivisionField, {
      props: {
        value: 'Old Province',
        actionLabel: 'Choose from list',
      },
    });

    expect(wrapper.text()).toContain('Old Province');

    const action = wrapper.findAll('button')
      .find(button => button.text() === 'Choose from list');

    expect(action).toBeDefined();
    await action!.trigger('click');

    expect(wrapper.emitted('choose')).toHaveLength(1);
  });

  it('stays read-only without an action when no replacement is available', async () => {
    const wrapper = await mountSuspended(LegacySubdivisionField, {
      props: { value: 'Retired Province' },
    });

    expect(wrapper.text()).toContain('Retired Province');
    expect(wrapper.findAll('button')).toHaveLength(0);
  });
});
