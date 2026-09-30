import { CouponTypes } from '@arc/enums/coupon';
import {
  computed, ref, watch, type Ref,
} from 'vue';
import type { CartCouponItem } from '~/domains/cart/api/contracts/cart.contract';
import { useApplyCartCoupon } from '~/domains/cart/mutations/apply-cart-coupon.mutation';
import { resolveCouponErrorMessage } from '~/domains/cart/utils/coupon-error';

type ManualCouponSlot = 'shipping' | 'discount';

function couponSlot(type: CouponTypes): ManualCouponSlot {
  return type === CouponTypes.FREE_SHIP ? 'shipping' : 'discount';
}

/**
 * Selection state for the shop coupon picker: the pending coupon set the buyer
 * builds before Accept, expressed as additions and removals against the codes
 * already applied to the cart. Every list row is a toggle, including an applied
 * one, so the picker never needs a separate removal path. A typed code is
 * validated through the apply endpoint (validation only — no cart write, so no
 * quote request) so its type is known and a same-slot collision is caught
 * before Accept. Accept owns the only write path.
 */
export function useCouponSelection(input: {
  appliedCodes: Ref<string[]>
  coupons: Ref<CartCouponItem[]>
  code: Ref<string>
  isOpen: Ref<boolean>
  shopId: () => string
  cartId: () => string | undefined
}) {
  const { mutateAsync: applyCoupon, isPending: isValidating } = useApplyCartCoupon({ onError: undefined });

  const stagedAdds = ref<string[]>([]);
  const removedCodes = ref<string[]>([]);
  const inputCodes = ref<string[]>([]);
  const inputError = ref('');
  /** Types learned from validated apply responses, for codes the listing omits. */
  const validatedTypes = ref<Record<string, CouponTypes>>({});

  const pendingCodes = computed(() => [...new Set([
    ...input.appliedCodes.value.filter(code => !removedCodes.value.includes(code)),
    ...stagedAdds.value,
  ])]);
  const selectedCount = computed(() => pendingCodes.value.length);
  const canAccept = computed(() => stagedAdds.value.length > 0 || removedCodes.value.length > 0);

  /** Keeps the pending set in step when the cart's codes change underneath it. */
  watch(input.appliedCodes, (applied) => {
    removedCodes.value = removedCodes.value.filter(code => applied.includes(code));
    stagedAdds.value = stagedAdds.value.filter(code => !applied.includes(code));
    inputCodes.value = inputCodes.value.filter(code => !applied.includes(code));
  });

  function isStaged(coupon: CartCouponItem) {
    return pendingCodes.value.includes(coupon.code);
  }

  /**
   * A shop cart holds at most one discount coupon and one shipping coupon, so
   * once a slot is taken the other coupons of that slot are blocked. Without
   * this the apply path would silently replace one of them at Accept time.
   */
  function couponSlotByCode(code: string): ManualCouponSlot | undefined {
    const type = input.coupons.value.find(coupon => coupon.code === code)?.type ??
      validatedTypes.value[code];

    return type === undefined ? undefined : couponSlot(type);
  }

  const stagedSlots = computed(() => {
    const slots = new Set<ManualCouponSlot>();

    for (const code of pendingCodes.value) {
      const slot = couponSlotByCode(code);
      if (slot) slots.add(slot);
    }

    return slots;
  });

  function isSlotBlocked(coupon: CartCouponItem) {
    const slot = couponSlotByCode(coupon.code);

    return !isStaged(coupon) && slot !== undefined && stagedSlots.value.has(slot);
  }

  function isSelectable(coupon: CartCouponItem) {
    return coupon.is_eligible && !isSlotBlocked(coupon);
  }

  /**
   * The combination hint is only useful when the shop can fill both slots: one
   * discount Coupon (FIXED_AMOUNT/PERCENTAGE) and one shipping Coupon.
   */
  const canSelectTwoCoupons = computed(() => {
    const selectable = input.coupons.value.filter(coupon => coupon.is_eligible);

    return selectable.some(coupon => couponSlot(coupon.type) === 'discount')
      && selectable.some(coupon => couponSlot(coupon.type) === 'shipping');
  });

  function reset() {
    stagedAdds.value = [];
    removedCodes.value = [];
    inputCodes.value = [];
    inputError.value = '';
  }

  watch(input.isOpen, (isOpen) => {
    if (isOpen) reset();
  });

  function toggleCode(coupon: CartCouponItem) {
    if (!isSelectable(coupon)) return;

    const applied = input.appliedCodes.value.includes(coupon.code);

    if (isStaged(coupon)) {
      stagedAdds.value = stagedAdds.value.filter(candidateCode => candidateCode !== coupon.code);
      inputCodes.value = inputCodes.value.filter(candidateCode => candidateCode !== coupon.code);
      if (applied) removedCodes.value = [...removedCodes.value, coupon.code];
      return;
    }

    if (applied) {
      removedCodes.value = removedCodes.value.filter(candidateCode => candidateCode !== coupon.code);
      return;
    }

    stagedAdds.value = [...stagedAdds.value, coupon.code];
  }

  /**
   * Validates the typed code against the pending set before staging it. The
   * response carries the accepted codes and their types, so a code the listing
   * omits still resolves to a slot and a same-slot collision — which the server
   * resolves by replacement — is reported instead of staged.
   */
  async function stageTypedCode() {
    const next = input.code.value.trim().toUpperCase();
    input.code.value = next;
    inputError.value = '';

    if (!next) return;
    if (pendingCodes.value.includes(next) || inputCodes.value.includes(next)) {
      inputError.value = 'Coupon code already applied';
      return;
    }

    try {
      const { promo_codes: promoCodes, applied_coupons: appliedCoupons } = await applyCoupon({
        shop_id: input.shopId(),
        cart_id: input.cartId(),
        code: next,
        promo_codes: pendingCodes.value,
      });

      for (const coupon of appliedCoupons) {
        validatedTypes.value[coupon.code] = coupon.type;
      }

      if (pendingCodes.value.some(code => !promoCodes.includes(code))) {
        const typedType = appliedCoupons.find(coupon => coupon.code === next)?.type;
        inputError.value = typedType === undefined
          ? 'Only one coupon per slot per shop'
          : `Only one ${couponSlot(typedType)} coupon per shop`;
        return;
      }

      stagedAdds.value = [...stagedAdds.value, next];
      inputCodes.value = [...inputCodes.value, next];
      input.code.value = '';
    }
    catch (error) {
      inputError.value = resolveCouponErrorMessage(error);
    }
  }

  function removeInputCode(inputCode: string) {
    stagedAdds.value = stagedAdds.value.filter(candidateCode => candidateCode !== inputCode);
    inputCodes.value = inputCodes.value.filter(candidateCode => candidateCode !== inputCode);
  }

  return {
    isValidating,
    inputCodes,
    inputError,
    selectedCount,
    canAccept,
    canSelectTwoCoupons,
    isStaged,
    isSelectable,
    toggleCode,
    stageTypedCode,
    removeInputCode,
    pendingCodes,
  };
}
