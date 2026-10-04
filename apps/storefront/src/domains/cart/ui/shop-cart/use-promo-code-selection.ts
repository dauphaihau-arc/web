import { PromotionBenefitType } from '@arc/enums/promotion';
import {
  computed, ref, watch, type Ref,
} from 'vue';
import type { CartPromoCodeItem } from '~/domains/cart/api/contracts/cart.contract';
import { useApplyCartPromoCode } from '~/domains/cart/mutations/apply-cart-promo-code.mutation';
import { resolvePromoCodeErrorMessage } from '~/domains/cart/utils/promo-code-error';

type ManualPromoCodeSlot = 'shipping' | 'discount';

function promoCodeSlot(benefitType: PromotionBenefitType): ManualPromoCodeSlot {
  return benefitType === PromotionBenefitType.FREE_SHIPPING ? 'shipping' : 'discount';
}

/**
 * Selection state for the shop promo code picker: the pending promo code set
 * the buyer builds before Accept, expressed as additions and removals against
 * the codes already applied to the cart. Every list row is a toggle, including
 * an applied one, so the picker never needs a separate removal path. A typed
 * code is validated through the apply endpoint (validation only — no cart
 * write, so no quote request) so its benefit type is known and a same-slot
 * collision is caught before Accept. Accept owns the only write path.
 */
export function usePromoCodeSelection(input: {
  appliedCodes: Ref<string[]>
  promoCodes: Ref<CartPromoCodeItem[]>
  code: Ref<string>
  isOpen: Ref<boolean>
  shopId: () => string
  cartId: () => string | undefined
}) {
  const { mutateAsync: applyPromoCode, isPending: isValidating } = useApplyCartPromoCode({ onError: undefined });

  const stagedAdds = ref<string[]>([]);
  const removedCodes = ref<string[]>([]);
  const inputCodes = ref<string[]>([]);
  const inputError = ref('');
  /** Benefit types learned from validated apply responses, for codes the listing omits. */
  const validatedBenefitTypes = ref<Record<string, PromotionBenefitType>>({});

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

  function isStaged(promoCode: CartPromoCodeItem) {
    return pendingCodes.value.includes(promoCode.code);
  }

  /**
   * A shop cart holds at most one discount promo code and one shipping promo
   * code, so once a slot is taken the other promo codes of that slot are
   * blocked. Without this the apply path would silently replace one of them at
   * Accept time.
   */
  function promoCodeSlotByCode(code: string): ManualPromoCodeSlot | undefined {
    const benefitType = input.promoCodes.value.find(promoCode => promoCode.code === code)?.benefit_type ??
      validatedBenefitTypes.value[code];

    return benefitType === undefined ? undefined : promoCodeSlot(benefitType);
  }

  const stagedSlots = computed(() => {
    const slots = new Set<ManualPromoCodeSlot>();

    for (const code of pendingCodes.value) {
      const slot = promoCodeSlotByCode(code);
      if (slot) slots.add(slot);
    }

    return slots;
  });

  function isSlotBlocked(promoCode: CartPromoCodeItem) {
    const slot = promoCodeSlotByCode(promoCode.code);

    return !isStaged(promoCode) && slot !== undefined && stagedSlots.value.has(slot);
  }

  function isSelectable(promoCode: CartPromoCodeItem) {
    return promoCode.is_eligible && !isSlotBlocked(promoCode);
  }

  /**
   * The combination hint is only useful when the shop can fill both slots: one
   * discount promo code (fixed_amount/percentage) and one shipping promo code.
   */
  const canSelectTwoPromoCodes = computed(() => {
    const selectable = input.promoCodes.value.filter(promoCode => promoCode.is_eligible);

    return selectable.some(promoCode => promoCodeSlot(promoCode.benefit_type) === 'discount')
      && selectable.some(promoCode => promoCodeSlot(promoCode.benefit_type) === 'shipping');
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

  function toggleCode(promoCode: CartPromoCodeItem) {
    if (!isSelectable(promoCode)) return;

    const applied = input.appliedCodes.value.includes(promoCode.code);

    if (isStaged(promoCode)) {
      stagedAdds.value = stagedAdds.value.filter(candidateCode => candidateCode !== promoCode.code);
      inputCodes.value = inputCodes.value.filter(candidateCode => candidateCode !== promoCode.code);
      if (applied) removedCodes.value = [...removedCodes.value, promoCode.code];
      return;
    }

    if (applied) {
      removedCodes.value = removedCodes.value.filter(candidateCode => candidateCode !== promoCode.code);
      return;
    }

    stagedAdds.value = [...stagedAdds.value, promoCode.code];
  }

  /**
   * Validates the typed code against the pending set before staging it. The
   * response carries the accepted codes and their benefit types, so a code the
   * listing omits still resolves to a slot and a same-slot collision — which
   * the server resolves by replacement — is reported instead of staged.
   */
  async function stageTypedCode() {
    const next = input.code.value.trim().toUpperCase();
    input.code.value = next;
    inputError.value = '';

    if (!next) return;
    if (pendingCodes.value.includes(next) || inputCodes.value.includes(next)) {
      inputError.value = 'Promo code already applied';
      return;
    }

    try {
      const { promo_codes: promoCodes, applied_promo_codes: appliedPromoCodes } = await applyPromoCode({
        shop_id: input.shopId(),
        cart_id: input.cartId(),
        code: next,
        promo_codes: pendingCodes.value,
      });

      for (const promoCode of appliedPromoCodes) {
        validatedBenefitTypes.value[promoCode.code] = promoCode.benefit_type;
      }

      if (pendingCodes.value.some(code => !promoCodes.includes(code))) {
        const typedBenefitType = appliedPromoCodes.find(promoCode => promoCode.code === next)?.benefit_type;
        inputError.value = typedBenefitType === undefined
          ? 'Only one promo code per slot per shop'
          : `Only one ${promoCodeSlot(typedBenefitType)} promo code per shop`;
        return;
      }

      stagedAdds.value = [...stagedAdds.value, next];
      inputCodes.value = [...inputCodes.value, next];
      input.code.value = '';
    }
    catch (error) {
      inputError.value = resolvePromoCodeErrorMessage(error);
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
    canSelectTwoPromoCodes,
    isStaged,
    isSelectable,
    toggleCode,
    stageTypedCode,
    removeInputCode,
    pendingCodes,
  };
}
