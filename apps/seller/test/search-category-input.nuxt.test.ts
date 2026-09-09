import {
  describe, expect, it, vi,
} from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import SearchCategoryInput from '~/app/pages/products/_components/search-category-input.vue';

vi.mock('~/domains/category/mutations/suggest-categories.mutation', () => ({
  useGetSuggestCategories: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

describe('SearchCategoryInput', () => {
  it('shows an asynchronously loaded category name in edit mode', async () => {
    const wrapper = mount(SearchCategoryInput, {
      props: {
        modelValue: 'category-1',
        category: undefined,
        title: 'Zoom Cortez x sacai',
      },
      global: {
        stubs: {
          UIcon: true,
        },
      },
    });

    await wrapper.setProps({
      category: {
        id: 'category-1',
        name: 'Sneakers',
        rank: 1,
        attributes: [],
      },
    });
    await flushPromises();

    expect((wrapper.get('input[role="combobox"]').element as HTMLInputElement).value).toBe('Sneakers');
  });
});
