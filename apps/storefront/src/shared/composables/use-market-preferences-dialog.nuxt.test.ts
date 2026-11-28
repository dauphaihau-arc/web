import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { useMarketPreferencesDialog } from './use-market-preferences-dialog';

const harness = defineComponent({
  setup() {
    const { isOpen, open, close } = useMarketPreferencesDialog();

    return () => h('div', { 'data-testid': 'state', 'data-open': String(isOpen.value) }, [
      h('button', { 'data-testid': 'open', onClick: open }, 'open'),
      h('button', { 'data-testid': 'close', onClick: close }, 'close'),
    ]);
  },
});

describe('useMarketPreferencesDialog', () => {
  it('shares the footer dialog open state', async () => {
    const wrapper = await mountSuspended(harness);

    expect(wrapper.attributes('data-open')).toBe('false');

    await wrapper.find('[data-testid="open"]').trigger('click');
    expect(wrapper.attributes('data-open')).toBe('true');

    await wrapper.find('[data-testid="close"]').trigger('click');
    expect(wrapper.attributes('data-open')).toBe('false');
  });
});
