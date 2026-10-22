import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import type { VueWrapper } from '@vue/test-utils';
import { routePaths, routes, isRouteActive } from '~/shared/navigation/routes';
import { shopSidebarItems } from './navigation-items';
import SubLinks from './sub-links.vue';

const { routeState } = vi.hoisted(() => ({
  routeState: {
    path: '/finances',
  },
}));

mockNuxtImport('useRoute', () => () => ({ path: routeState.path }));

const financesItem = shopSidebarItems.find(item => item.title === 'Finances')!;

if (!financesItem) {
  throw new Error('Finances sidebar item is missing');
}

async function render(path: string) {
  routeState.path = path;

  return mountSuspended(SubLinks, {
    props: { data: financesItem },
  });
}

function link(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('a').find(candidate => candidate.text() === label);

  if (!found) {
    throw new Error(`Sidebar link "${label}" not found`);
  }

  return found;
}

function isLinkActive(wrapper: VueWrapper, label: string) {
  return link(wrapper, label).classes().includes('link-active');
}

describe('finances sidebar split', () => {
  beforeEach(() => {
    routeState.path = routePaths.finances;
  });

  it('exposes the finance route helpers', () => {
    expect(routes.finances()).toEqual({ path: '/finances' });
    expect(routes.financesTransactions()).toEqual({ path: '/finances/transactions' });
    expect(routes.financesPayouts()).toEqual({ path: '/finances/payouts' });
  });

  it('uses exact matching only for the overview entry', () => {
    expect(isRouteActive('/finances', routePaths.finances, true)).toBe(true);
    expect(isRouteActive('/finances/transactions', routePaths.finances, true)).toBe(false);
    expect(isRouteActive('/finances/transactions', routePaths.finances)).toBe(true);
    expect(isRouteActive('/finances/payouts', routePaths.finances, true)).toBe(false);
  });

  it('is a parent with Overview, Transactions and Payouts sub-items', () => {
    expect(financesItem.to).toBeUndefined();
    expect(financesItem.sub?.map(item => item.title)).toEqual([
      'Overview',
      'Transactions',
      'Payouts',
    ]);
    expect(financesItem.sub?.map(item => item.to)).toEqual([
      routes.finances(),
      routes.financesTransactions(),
      routes.financesPayouts(),
    ]);
  });

  it('marks only Overview active on the overview route', async () => {
    const wrapper = await render(routePaths.finances);

    expect(isLinkActive(wrapper, 'Overview')).toBe(true);
    expect(isLinkActive(wrapper, 'Transactions')).toBe(false);
    expect(isLinkActive(wrapper, 'Payouts')).toBe(false);
  });

  it('marks only Transactions active on the transactions route', async () => {
    const wrapper = await render(routePaths.financesTransactions);

    expect(isLinkActive(wrapper, 'Overview')).toBe(false);
    expect(isLinkActive(wrapper, 'Transactions')).toBe(true);
    expect(isLinkActive(wrapper, 'Payouts')).toBe(false);
  });

  it('marks only Payouts active on the payouts route', async () => {
    const wrapper = await render(routePaths.financesPayouts);

    expect(isLinkActive(wrapper, 'Overview')).toBe(false);
    expect(isLinkActive(wrapper, 'Transactions')).toBe(false);
    expect(isLinkActive(wrapper, 'Payouts')).toBe(true);
  });

  it('keeps the Finances parent highlighted on every finance route', async () => {
    for (const path of [
      routePaths.finances,
      routePaths.financesTransactions,
      routePaths.financesPayouts,
    ]) {
      const wrapper = await render(path);
      const header = wrapper.findAll('div').find(candidate =>
        candidate.classes().includes('link-theme') && candidate.text() === 'Finances',
      );

      expect(header, `Finances header missing for ${path}`).toBeDefined();
      expect(header?.classes()).toContain('link-active');
    }
  });
});
