import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { ProductStates } from '@arc/enums/product';
import type { ProductRow } from '../products-table.types';
import ProductsTableRowActions from './products-table-row-actions.vue';

function row(state: ProductStates): ProductRow {
  return {
    id: 'p1',
    slug: 'blue-tee',
    title: 'Blue Tee',
    state,
    variants: [],
    options: [],
    inventory: [],
    hasOptions: false,
  };
}

async function openMenu(state: ProductStates) {
  const wrapper = await mountSuspended(ProductsTableRowActions, {
    props: { row: row(state) },
    attachTo: document.body,
  });

  /** The "More actions" trigger is the last button in the cell. */
  const trigger = wrapper.findAll('button').at(-1);
  await trigger!.trigger('click');
  await wrapper.vm.$nextTick();

  return { wrapper, menuText: document.body.textContent ?? '' };
}

describe('products table row actions menu', () => {
  it('offers deactivate, edit, preview and delete for a live product', async () => {
    const { wrapper, menuText } = await openMenu(ProductStates.ACTIVE);

    expect(menuText).toContain('Deactivate');
    expect(menuText).toContain('Edit');
    expect(menuText).toContain('Preview');
    expect(menuText).toContain('Delete');
    expect(menuText).not.toContain('Duplicate');

    wrapper.unmount();
  });

  it('hides deactivate, preview and duplicate for a draft product', async () => {
    const { wrapper, menuText } = await openMenu(ProductStates.DRAFT);

    expect(menuText).toContain('Edit');
    expect(menuText).toContain('Delete');
    expect(menuText).not.toContain('Deactivate');
    expect(menuText).not.toContain('Preview');
    expect(menuText).not.toContain('Duplicate');

    wrapper.unmount();
  });
});
