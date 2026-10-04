/**
 * A Promo Code the buyer had applied which a refreshed checkout quote no longer
 * accepts, and the line explaining its removal in the shop's coupon section.
 */
export type PromoCodeRemovalNotice = {
  code: string
  message: string
};

/**
 * Why a code was dropped, in the buyer's words. The refreshed quote does not
 * carry the reason a code became ineligible, so the copy stays honest about
 * what is known rather than guessing ("fully redeemed", "wrong items", …).
 */
export function buildPromoCodeRemovalNotices(
  codes: readonly string[],
): PromoCodeRemovalNotice[] {
  return codes.map(code => ({
    code,
    message: `Promo code ${code} is no longer available and was removed.`,
  }));
}

/**
 * The applied Promo Codes a refreshed checkout quote no longer accepts, per
 * shop, keyed by shop id.
 *
 * A quote silently drops a code that has become ineligible (exhausted, walled
 * by a per-buyer limit, no longer active) rather than failing, so the client's
 * selection can list a code the totals no longer include. Comparing the two is
 * the only way to keep the chips honest after a commitment is refused for
 * changed prices. Both sides are given in camelCase; the caller maps the API
 * response at that boundary.
 *
 * A shop the accepted set does not contain is left alone: with nothing to
 * compare against, dropping the buyer's selection would be a guess.
 */
export function findDroppedPromoCodes(
  selections: ReadonlyArray<{ shopId: string, promoCodes: string[] }>,
  acceptedShops: ReadonlyArray<{ shopId: string, promoCodes: string[] }>,
): Map<string, string[]> {
  const acceptedByShop = new Map(
    acceptedShops.map(shop => [shop.shopId, new Set(shop.promoCodes)]),
  );

  const droppedByShop = new Map<string, string[]>();

  for (const selection of selections) {
    const accepted = acceptedByShop.get(selection.shopId);

    if (!accepted) {
      continue;
    }

    const dropped = selection.promoCodes.filter(code => !accepted.has(code));

    if (dropped.length > 0) {
      droppedByShop.set(selection.shopId, dropped);
    }
  }

  return droppedByShop;
}
