import {
  PromoCodeIneligibleReason,
  PromotionBenefitType,
  PromotionMinOrderType,
  PromotionProductScope,
} from '@arc/enums/promotion';
import {
  DOMWrapper, flushPromises, mount, type VueWrapper,
} from '@vue/test-utils';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import type { ApplyCartPromoCodeRequest, CartPromoCodeItem } from '~/domains/cart/api/contracts/cart.contract';
import { nextTick } from 'vue';
import ShopCartPromoCodesUi from './shop-cart-promo-codes-ui.vue';

const promoCodesFixture = vi.hoisted(() => ({ promo_codes: [] as unknown[] }));
const applyPromoCodeFixture = vi.hoisted(() => ({
  handler: null as null | ((body: ApplyCartPromoCodeRequest) => unknown),
  calls: [] as ApplyCartPromoCodeRequest[],
}));

vi.mock('~/domains/cart/queries/cart-promo-codes.query', async () => {
  const { ref } = await import('vue');

  return {
    useGetCartPromoCodes: () => ({
      data: ref({ promo_codes: promoCodesFixture.promo_codes }),
      isPending: ref(false),
      isError: ref(false),
    }),
  };
});

vi.mock('~/domains/cart/mutations/apply-cart-promo-code.mutation', async () => {
  const { ref } = await import('vue');

  return {
    useApplyCartPromoCode: () => ({
      mutateAsync: async (body: ApplyCartPromoCodeRequest) => {
        applyPromoCodeFixture.calls.push(body);

        if (applyPromoCodeFixture.handler) return applyPromoCodeFixture.handler(body);

        const codes = [...new Set([...body.promo_codes, body.code])];
        const fixture = promoCodesFixture.promo_codes as CartPromoCodeItem[];

        return {
          promo_codes: codes,
          applied_promo_codes: codes.map(code => ({
            code,
            benefit_type: fixture.find(promoCode => promoCode.code === code)?.benefit_type ?? PromotionBenefitType.PERCENTAGE,
          })),
        };
      },
      isPending: ref(false),
    }),
  };
});

const DISCOUNT_PROMO_CODE: CartPromoCodeItem = {
  code: 'SAVE10',
  benefit_type: PromotionBenefitType.PERCENTAGE,
  product_scope: PromotionProductScope.ALL,
  percent_off: 10,
  min_order_type: PromotionMinOrderType.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: true,
  ineligible_reason: null,
};

const FIXED_PROMO_CODE: CartPromoCodeItem = {
  code: 'FLAT5',
  benefit_type: PromotionBenefitType.FIXED_AMOUNT,
  product_scope: PromotionProductScope.ALL,
  amount_off: 5,
  min_order_type: PromotionMinOrderType.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: true,
  ineligible_reason: null,
};

const SHIPPING_PROMO_CODE: CartPromoCodeItem = {
  code: 'FREESHIP',
  benefit_type: PromotionBenefitType.FREE_SHIPPING,
  product_scope: PromotionProductScope.ALL,
  min_order_type: PromotionMinOrderType.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: true,
  ineligible_reason: null,
};

const SCOPED_PROMO_CODE: CartPromoCodeItem = {
  code: 'MUGONLY',
  benefit_type: PromotionBenefitType.PERCENTAGE,
  product_scope: PromotionProductScope.SPECIFIC,
  percent_off: 5,
  min_order_type: PromotionMinOrderType.NONE,
  end_date: '2027-01-01T00:00:00.000Z',
  currency: 'USD',
  is_eligible: false,
  ineligible_reason: PromoCodeIneligibleReason.PRODUCT_SCOPE,
};

beforeEach(() => {
  promoCodesFixture.promo_codes = [DISCOUNT_PROMO_CODE, FIXED_PROMO_CODE, SHIPPING_PROMO_CODE, SCOPED_PROMO_CODE];
  applyPromoCodeFixture.handler = null;
  applyPromoCodeFixture.calls = [];
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
  const wrapper = mount(ShopCartPromoCodesUi, {
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

const HINT = 'Apply up to 2 promo codes per shop: 1 free-shipping code and 1 product-discount code.';

/**
 * The tooltip trigger sits next to the counter; the icon itself does not render
 * in unit tests (async NuxtIcon without Suspense), so the trigger is located
 * through the counter it follows.
 */
function hintTrigger(wrapper: VueWrapper) {
  const counter = wrapper.find('p[aria-live="polite"]');

  return counter.exists() ? counter.element.nextElementSibling : null;
}

describe('shop cart promo codes picker', () => {
  it('stages a selected promo code without applying or closing the picker', async () => {
    const wrapper = await render();
    const promoCodeRow = buttonWithText(wrapper, 'SAVE10');

    await promoCodeRow?.trigger('click');

    expect(wrapper.text()).toContain('1 promo code selected');
    expect(promoCodeRow?.attributes('aria-pressed')).toBe('true');
    expect(wrapper.emitted('accept')).toBeUndefined();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('toggles a staged promo code back off', async () => {
    const wrapper = await render();
    const promoCodeRow = buttonWithText(wrapper, 'SAVE10');

    await promoCodeRow?.trigger('click');
    expect(wrapper.text()).toContain('1 promo code selected');

    await promoCodeRow?.trigger('click');
    expect(wrapper.text()).not.toContain('promo code selected');
  });

  it('keeps ineligible promo codes disabled and unstaged', async () => {
    const wrapper = await render();
    const promoCodeRow = buttonWithText(wrapper, 'MUGONLY');

    expect(promoCodeRow?.attributes('disabled')).toBeDefined();

    await promoCodeRow?.trigger('click');

    expect(wrapper.text()).not.toContain('promo code selected');
  });

  it('blocks a second promo code of the same slot but allows the other slot', async () => {
    const wrapper = await render();

    await buttonWithText(wrapper, 'SAVE10')?.trigger('click');

    const flatRow = buttonWithText(wrapper, 'FLAT5');
    const freeShipRow = buttonWithText(wrapper, 'FREESHIP');

    expect(flatRow?.attributes('disabled')).toBeDefined();
    expect(freeShipRow?.attributes('disabled')).toBeUndefined();

    await flatRow?.trigger('click');
    expect(wrapper.text()).toContain('1 promo code selected');

    await freeShipRow?.trigger('click');
    expect(wrapper.text()).toContain('2 promo codes selected');
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

    promoCodesFixture.promo_codes = [DISCOUNT_PROMO_CODE, FIXED_PROMO_CODE, SCOPED_PROMO_CODE];
    const discountOnly = await render();
    await buttonWithText(discountOnly, 'SAVE10')?.trigger('click');
    expect(hintTrigger(discountOnly)).toBeNull();
  });

  it('counts a code that becomes applied while the picker stays open', async () => {
    const wrapper = await render({ codes: [] });

    await wrapper.setProps({ codes: ['SAVE10'] });
    await flushPromises();

    expect(wrapper.text()).toContain('1 promo code selected');
    expect(buttonWithText(wrapper, 'SAVE10')?.attributes('aria-pressed')).toBe('true');
  });

  it('stages a typed code as a chip without applying it, and commits it on Accept', async () => {
    const wrapper = await render();

    await wrapper.find('input').setValue('save5');
    await addButton(wrapper).trigger('click');

    expect(wrapper.text()).toContain('SAVE5');
    expect(wrapper.text()).toContain('1 promo code selected');
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

    expect(applyPromoCodeFixture.calls.at(-1)).toEqual({
      shop_id: 'shop-1',
      cart_id: undefined,
      code: 'SAVE5',
      promo_codes: [],
    });
    expect(wrapper.text()).toContain('SAVE5');
  });

  it('reports a same-slot collision instead of staging the typed code', async () => {
    applyPromoCodeFixture.handler = () => ({
      promo_codes: ['FLAT5'],
      applied_promo_codes: [{ code: 'FLAT5', benefit_type: PromotionBenefitType.FIXED_AMOUNT }],
    });
    const wrapper = await render({ codes: ['SAVE10'] });

    await wrapper.find('input').setValue('FLAT5');
    await addButton(wrapper).trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Only one discount promo code per shop');
    expect(wrapper.text()).not.toContain('2 promo codes selected');
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

    expect(wrapper.text()).not.toContain('promo code selected');
    expect(wrapper.emitted('removeCode')).toBeUndefined();
  });

  it('rejects staging the same code twice', async () => {
    const wrapper = await render();

    await wrapper.find('input').setValue('SAVE5');
    await addButton(wrapper).trigger('click');
    await wrapper.find('input').setValue('SAVE5');
    await addButton(wrapper).trigger('click');

    expect(wrapper.text()).toContain('Promo code already applied');
    expect(wrapper.text()).toContain('1 promo code selected');
  });

  it('does not add a chip for a promo code picked from the list', async () => {
    const wrapper = await render();

    await buttonWithText(wrapper, 'SAVE10')?.trigger('click');

    expect(wrapper.findAll('button').filter(button => button.text().trim() === 'SAVE10')).toHaveLength(0);
    expect(wrapper.text()).toContain('1 promo code selected');
  });

  it('marks the trigger as active while the picker is open', async () => {
    const closed = await render({ open: false });
    expect(buttonWithText(closed, 'Apply shop promo codes')?.classes()).not.toContain('bg-surface-hover');

    const opened = await render({ open: true });
    expect(buttonWithText(opened, 'Apply shop promo codes')?.classes()).toContain('bg-surface-hover');
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

  it('counts an already applied promo code as selected and lets it be toggled off', async () => {
    const wrapper = await render({ codes: ['SAVE10'] });
    const promoCodeRow = buttonWithText(wrapper, 'SAVE10');

    expect(wrapper.text()).toContain('1 promo code selected');
    expect(promoCodeRow?.attributes('disabled')).toBeUndefined();

    await promoCodeRow?.trigger('click');
    expect(wrapper.text()).not.toContain('promo code selected');

    await commitButton(wrapper).trigger('click');
    expect(wrapper.emitted('accept')?.[0]).toEqual([[]]);
  });

  it('shows the shared panel error instead of relying on a toast', async () => {
    const wrapper = await render({ panelError: 'Delete promo code failed' });

    expect(wrapper.text()).toContain('Delete promo code failed');
  });
});
