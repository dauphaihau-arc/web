import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { useMarketPreferencesDialog } from './use-market-preferences-dialog';

const preferencesDialogHarness = defineComponent({
  setup() {
    const { isOpen, open, close } = useMarketPreferencesDialog();

    return () => h('div', { 'data-testid': 'dialog-state', 'data-open': String(isOpen.value) }, [
      h('button', { 'data-testid': 'open', onClick: open }, 'open'),
      h('button', { 'data-testid': 'close', onClick: close }, 'close'),
    ]);
  },
});

describe('useMarketPreferencesDialog', () => {
  it('opens the single footer-owned dialog through shared state', async () => {
    const wrapper = await mountSuspended(preferencesDialogHarness);

    expect(wrapper.attributes('data-open')).toBe('false');

    await wrapper.find('[data-testid="open"]').trigger('click');

    expect(wrapper.attributes('data-open')).toBe('true');

    await wrapper.find('[data-testid="close"]').trigger('click');

    expect(wrapper.attributes('data-open')).toBe('false');
  });
});
