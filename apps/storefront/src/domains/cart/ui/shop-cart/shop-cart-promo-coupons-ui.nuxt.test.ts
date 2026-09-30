import {
  CouponAppliesTo, CouponIneligibleReason, CouponMinOrderTypes, CouponTypes,
} from '@arc/enums/coupon';
import {
  DOMWrapper, flushPromises, mount, type VueWrapper,
} from '@vue/test-utils';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import type { ApplyCartCouponRequest, CartCouponItem } from '~/domains/cart/api/contracts/cart.contract';
import { nextTick } from 'vue';
import ShopCartPromoCouponsUi from './shop-cart-promo-coupons-ui.vue';

const couponsFixture = vi.hoisted(() => ({ coupons: [] as unknown[] }));
const applyCouponFixture = vi.hoisted(() => ({
  handler: null as null | ((body: ApplyCartCouponRequest) => unknown),
  calls: [] as ApplyCartCouponRequest[],
}));

vi.mock('~/domains/cart/queries/cart-coupons.query', async () => {
  const { ref } = await import('vue');

  return {
    useGetCartCoupons: () => ({
      data: ref({ coupons: couponsFixture.coupons }),
      isPending: ref(false),
      isError: ref(false),
    }),
  };
});

vi.mock('~/domains/cart/mutations/apply-cart-coupon.mutation', async () => {
  const { ref } = await import('vue');

  return {
    useApplyCartCoupon: () => ({
      mutateAsync: async (body: ApplyCartCouponRequest) => {
        applyCouponFixture.calls.push(body);

        if (applyCouponFixture.handler) return applyCouponFixture.handler(body);

        const codes = [...new Set([...body.promo_codes, body.code])];
        const fixture = couponsFixture.coupons as CartCouponItem[];

        return {
          promo_codes: codes,
          applied_coupons: codes.map(code => ({
            code,
            type: fixture.find(coupon => coupon.code === code)?.type ?? 'percentage',
          })),
        };
      },
      isPending: ref(false),
    }),
  };
});

const DISCOUNT_COUPON: CartCouponItem = {
  code: 'SAVE10',
  type: CouponTypes.PERCENTAGE,
  applies_to: CouponAppliesTo.ALL,
  percent_off: 10,
  min_order_type: CouponMinOrderTypes.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: true,
  ineligible_reason: null,
};

const FIXED_COUPON: CartCouponItem = {
  code: 'FLAT5',
  type: CouponTypes.FIXED_AMOUNT,
  applies_to: CouponAppliesTo.ALL,
  amount_off: 5,
  min_order_type: CouponMinOrderTypes.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: true,
  ineligible_reason: null,
};

const SHIPPING_COUPON: CartCouponItem = {
  code: 'FREESHIP',
  type: CouponTypes.FREE_SHIP,
  applies_to: CouponAppliesTo.ALL,
  min_order_type: CouponMinOrderTypes.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: true,
  ineligible_reason: null,
};

const SCOPED_COUPON: CartCouponItem = {
  code: 'MUGONLY',
  type: CouponTypes.PERCENTAGE,
  applies_to: CouponAppliesTo.SPECIFIC,
  percent_off: 5,
  min_order_type: CouponMinOrderTypes.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: false,
  ineligible_reason: CouponIneligibleReason.PRODUCT_SCOPE,
};

beforeEach(() => {
  couponsFixture.coupons = [DISCOUNT_COUPON, FIXED_COUPON, SHIPPING_COUPON, SCOPED_COUPON];
  applyCouponFixture.handler = null;
  applyCouponFixture.calls = [];
});

/**
 * The popover opens in its `onMounted`, so the flush lets the panel render into
 * the wrapper before the assertions run.
 */
async function render(input: {
  codes?: string[]
  open?: boolean
  panelError?: string
  disabled?: boolean
  isApplying?: boolean
} = {}) {
  const wrapper = mount(ShopCartPromoCouponsUi, {
    props: {
      shopId: 'shop-1',
      shopName: 'Ceramics Studio',
      codes: input.codes ?? [],
      code: '',
      open: input.open ?? true,
      panelError: input.panelError ?? '',
      disabled: input.disabled ?? false,
      isApplying: input.isApplying ?? false,
    },
  });

  await flushPromises();

  return wrapper;
}

function buttonWithText(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('button').find(button => button.text().includes(text));
}

/**
 * The code-field action and the footer confirm both render a button, so they are
 * located structurally instead of by label.
 */
function addButton(wrapper: VueWrapper) {
  const group = wrapper.find('input').element.parentElement?.parentElement;

  return new DOMWrapper(group!.querySelector('button')!);
}

function commitButton(wrapper: VueWrapper) {
  const cancel = buttonWithText(wrapper, 'Cancel');

  return new DOMWrapper(cancel!.element.parentElement!).findAll('button')[1];
}

const HINT = 'Apply up to 2 coupons per shop: 1 shipping coupon and 1 order discount coupon.';

/**
 * The tooltip trigger sits next to the counter; the icon itself does not render
 * in unit tests (async NuxtIcon without Suspense), so the trigger is located
 * through the counter it follows.
 */
function hintTrigger(wrapper: VueWrapper) {
  const counter = wrapper.find('p[aria-live="polite"]');

  return counter.exists() ? counter.element.nextElementSibling : null;
}

describe('shop cart promo coupons picker', () => {
  it('stages a selected coupon without applying or closing the picker', async () => {
    const wrapper = await render();
    const couponRow = buttonWithText(wrapper, 'SAVE10');

    await couponRow?.trigger('click');

    expect(wrapper.text()).toContain('1 coupon selected');
    expect(couponRow?.attributes('aria-pressed')).toBe('true');
    expect(wrapper.emitted('accept')).toBeUndefined();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('toggles a staged coupon back off', async () => {
    const wrapper = await render();
    const couponRow = buttonWithText(wrapper, 'SAVE10');

    await couponRow?.trigger('click');
    expect(wrapper.text()).toContain('1 coupon selected');

    await couponRow?.trigger('click');
    expect(wrapper.text()).not.toContain('coupon selected');
  });

  it('keeps ineligible coupons disabled and unstaged', async () => {
    const wrapper = await render();
    const couponRow = buttonWithText(wrapper, 'MUGONLY');

    expect(couponRow?.attributes('disabled')).toBeDefined();

    await couponRow?.trigger('click');

    expect(wrapper.text()).not.toContain('coupon selected');
  });

  it('blocks a second coupon of the same slot but allows the other slot', async () => {
    const wrapper = await render();

    await buttonWithText(wrapper, 'SAVE10')?.trigger('click');

    const flatRow = buttonWithText(wrapper, 'FLAT5');
    const freeShipRow = buttonWithText(wrapper, 'FREESHIP');

    expect(flatRow?.attributes('disabled')).toBeDefined();
    expect(freeShipRow?.attributes('disabled')).toBeUndefined();

    await flatRow?.trigger('click');
    expect(wrapper.text()).toContain('1 coupon selected');

    await freeShipRow?.trigger('click');
    expect(wrapper.text()).toContain('2 coupons selected');
  });

  it('shows the combination hint tooltip next to the counter only when both slots are selectable', async () => {
    const wrapper = await render();
    await buttonWithText(wrapper, 'SAVE10')?.trigger('click');

    const hint = hintTrigger(wrapper);
    expect(hint).not.toBeNull();

    // The tooltip opens on its wrapper's `mouseenter`, which does not bubble
    // from the icon, so hover the wrapper element itself.
    vi.useFakeTimers();
    await new DOMWrapper(hint!).trigger('mouseenter');
    vi.advanceTimersByTime(200);
    vi.useRealTimers();
    await nextTick();

    expect(wrapper.text()).toContain(HINT);

    // The Nuxt UI default bubble is single-line with `truncate`; the override
    // must let the long hint wrap instead of clipping it.
    const bubble = wrapper.findAll('div').filter(node => node.text() === HINT).at(-1);
    expect(bubble?.classes()).not.toContain('truncate');
    expect(bubble?.classes()).toContain('whitespace-normal');

    couponsFixture.coupons = [DISCOUNT_COUPON, FIXED_COUPON, SCOPED_COUPON];
    const discountOnly = await render();
    await buttonWithText(discountOnly, 'SAVE10')?.trigger('click');
    expect(hintTrigger(discountOnly)).toBeNull();
  });

  it('counts a code that becomes applied while the picker stays open', async () => {
    const wrapper = await render({ codes: [] });

    await wrapper.setProps({ codes: ['SAVE10'] });
    await flushPromises();

    expect(wrapper.text()).toContain('1 coupon selected');
    expect(buttonWithText(wrapper, 'SAVE10')?.attributes('aria-pressed')).toBe('true');
  });

  it('stages a typed code as a chip without applying it, and commits it on Accept', async () => {
    const wrapper = await render();

    await wrapper.find('input').setValue('save5');
    await addButton(wrapper).trigger('click');

    expect(wrapper.text()).toContain('SAVE5');
    expect(wrapper.text()).toContain('1 coupon selected');
    expect(wrapper.emitted('accept')).toBeUndefined();
    expect(wrapper.emitted('removeCode')).toBeUndefined();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

    await commitButton(wrapper)?.trigger('click');
    expect(wrapper.emitted('accept')?.[0]).toEqual([['SAVE5']]);
  });

  it('validates a typed code through the apply endpoint before staging it', async () => {
    const wrapper = await render();

    await wrapper.find('input').setValue('save5');
    await addButton(wrapper).trigger('click');
    await flushPromises();

    expect(applyCouponFixture.calls.at(-1)).toEqual({
      shop_id: 'shop-1',
      cart_id: undefined,
      code: 'SAVE5',
      promo_codes: [],
    });
    expect(wrapper.text()).toContain('SAVE5');
  });

  it('reports a same-slot collision instead of staging the typed code', async () => {
    applyCouponFixture.handler = () => ({
      promo_codes: ['FLAT5'],
      applied_coupons: [{ code: 'FLAT5', type: 'fixed_amount' }],
    });
    const wrapper = await render({ codes: ['SAVE10'] });

    await wrapper.find('input').setValue('FLAT5');
    await addButton(wrapper).trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Only one discount coupon per shop');
    expect(wrapper.text()).not.toContain('2 coupons selected');
  });

  it('blocks the same-slot rows for a code staged from the input', async () => {
    const wrapper = await render();

    await wrapper.find('input').setValue('SAVE10');
    await addButton(wrapper).trigger('click');

    expect(buttonWithText(wrapper, 'FLAT5')?.attributes('disabled')).toBeDefined();
    expect(buttonWithText(wrapper, 'FREESHIP')?.attributes('disabled')).toBeUndefined();
  });

  it('drops a typed code chip without a request when its remove button is used', async () => {
    const wrapper = await render();

    await wrapper.find('input').setValue('SAVE5');
    await addButton(wrapper).trigger('click');

    const chip = wrapper.findAll('button').find(button => button.text().trim() === 'SAVE5');
    const chipRemove = chip?.element.parentElement?.querySelectorAll('button')[1];
    await new DOMWrapper(chipRemove!).trigger('click');

    expect(wrapper.text()).not.toContain('coupon selected');
    expect(wrapper.emitted('removeCode')).toBeUndefined();
  });

  it('rejects staging the same code twice', async () => {
    const wrapper = await render();

    await wrapper.find('input').setValue('SAVE5');
    await addButton(wrapper).trigger('click');
    await wrapper.find('input').setValue('SAVE5');
    await addButton(wrapper).trigger('click');

    expect(wrapper.text()).toContain('Coupon code already applied');
    expect(wrapper.text()).toContain('1 coupon selected');
  });

  it('does not add a chip for a coupon picked from the list', async () => {
    const wrapper = await render();

    await buttonWithText(wrapper, 'SAVE10')?.trigger('click');

    expect(wrapper.findAll('button').filter(button => button.text().trim() === 'SAVE10')).toHaveLength(0);
    expect(wrapper.text()).toContain('1 coupon selected');
  });

  it('marks the trigger as active while the picker is open', async () => {
    const closed = await render({ open: false });
    expect(buttonWithText(closed, 'Apply shop coupon codes')?.classes()).not.toContain('bg-surface-hover');

    const opened = await render({ open: true });
    expect(buttonWithText(opened, 'Apply shop coupon codes')?.classes()).toContain('bg-surface-hover');
  });

  it('disables the code input and its Apply button while an apply is in flight', async () => {
    const wrapper = await render({ disabled: true, isApplying: true });

    expect(addButton(wrapper).attributes('disabled')).toBeDefined();
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });

  it('emits the accepted codes and closes only when Accept is pressed', async () => {
    const wrapper = await render();
    const acceptButton = commitButton(wrapper);

    expect(acceptButton?.attributes('disabled')).toBeDefined();

    await buttonWithText(wrapper, 'SAVE10')?.trigger('click');
    await commitButton(wrapper)?.trigger('click');

    expect(wrapper.emitted('accept')?.[0]).toEqual([['SAVE10']]);
  });

  it('closes without applying when Cancel is pressed', async () => {
    const wrapper = await render();
    await buttonWithText(wrapper, 'SAVE10')?.trigger('click');
    await buttonWithText(wrapper, 'Cancel')?.trigger('click');

    expect(wrapper.emitted('accept')).toBeUndefined();
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
  });

  it('counts an already applied coupon as selected and lets it be toggled off', async () => {
    const wrapper = await render({ codes: ['SAVE10'] });
    const couponRow = buttonWithText(wrapper, 'SAVE10');

    expect(wrapper.text()).toContain('1 coupon selected');
    expect(couponRow?.attributes('disabled')).toBeUndefined();

    await couponRow?.trigger('click');
    expect(wrapper.text()).not.toContain('coupon selected');

    await commitButton(wrapper).trigger('click');
    expect(wrapper.emitted('accept')?.[0]).toEqual([[]]);
  });

  it('shows the shared panel error instead of relying on a toast', async () => {
    const wrapper = await render({ panelError: 'Delete coupon failed' });

    expect(wrapper.text()).toContain('Delete coupon failed');
  });
});
