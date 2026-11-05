import { describe, expect, it } from 'vitest'
import * as arcEnums from '@arc/enums'
import { API_ENUM_VALUES } from './generated/api-enums'

/**
 * Every enum-shaped export of `@arc/enums`: all `export enum` declarations plus
 * the two `as const` enum maps (`ShippingProfileStatuses`,
 * `ShippingDestinationScopes`). Register new enums here so conformance keeps
 * covering them; the test fails on spec tuples that gain an FE counterpart
 * without being registered (they show up as missing matches).
 */
const FE_ENUM_EXPORTS = [
  'ResetPasswordViews',
  'FulfillmentMethods',
  'FulfillmentOperators',
  'FulfillmentProvenances',
  'ShipmentStatuses',
  'ShipmentLabelStatuses',
  'ShipmentUpdateActorTypes',
  'ShipmentUpdateSources',
  'FulfillmentAggregateStatuses',
  'ShipmentRateServices',
  'ShopPayoutSources',
  'ShopTransactionTypes',
  'OrderPayoutStates',
  'PayoutAccountStatuses',
  'OrderPayoutMethodAccountStatuses',
  'LocalStorageKeys',
  'MarketCurrencies',
  'MarketLanguages',
  'MarketRegions',
  'OrderStatuses',
  'PaymentTypes',
  'OrderShippingStatuses',
  'ProductStates',
  'ProductWhoMade',
  'ProductVariantTypes',
  'MarketGetProductsSortBy',
  'PromotionApplicationKind',
  'PromotionBenefitType',
  'PromotionProductScope',
  'PromotionMinOrderType',
  'PromotionStatus',
  'PromoCodeIneligibleReason',
  'RESOURCES',
  'SessionStorageKeys',
  'ShippingProfileStatuses',
  'ShippingDestinationScopes',
  'TokenTypes',
] as const

/**
 * Spec enum tuples that intentionally have no `@arc/enums` counterpart. Keeping
 * them here needs a reviewer to sign off; the test fails if an entry goes stale.
 */
const SPEC_ONLY_ENUMS: Record<string, string> = {
  // Bulk verbs over product selection; each product state is a separate field.
  'components.schemas.BulkMutateShopProductsDto.properties.action':
    'API-only bulk product action verbs',
  // Guest/user cart ownership discriminator; no FE enum reads a cart owner type.
  'components.schemas.CartResponseDto.properties.cart_owner_type':
    'API-only cart ownership discriminator',
  // Checkout shows the pricing source but never switches on it.
  'components.schemas.CheckoutQuoteItemResponseDto.properties.source_type':
    'API-only checkout pricing provenance',
  // Create payload intentionally forbids `archived`; FE sends ShippingProfileStatuses values.
  'components.schemas.CreateShippingProfileDto.properties.status':
    'create-payload subset of ShippingProfileStatuses (no `archived`)',
  // Promo-code visibility is set by shop admins; FE has no shared enum for it.
  'components.schemas.CreateShopPromoCodeDto.properties.visibility':
    'API-only promo-code visibility',
  // Order-export UI selectors; no FE enum models spreadsheet export options.
  'components.schemas.ExportShopOrdersQueryDto.properties.column_preset':
    'API-only order-export column preset',
  'components.schemas.ExportShopOrdersQueryDto.properties.date_range':
    'API-only order-export date-range selector',
  // Each web app pins its own request `app` value; the seller subset is narrower.
  'components.schemas.ForgotPasswordDto.properties.app':
    'request subset of the login app union; each app pins its own value',
  // Liveness/readiness probes consumed by infrastructure, not the web clients.
  'components.schemas.HealthCheckResponseDto.properties.status':
    'internal health-probe contract',
  'components.schemas.HealthComponentResponseDto.properties.status':
    'internal health-probe contract',
  // Single image upload asset kind accepted by the image pipeline.
  'components.schemas.IssueProductImageUploadDto.properties.asset_type':
    'single accepted image asset kind',
  // App discriminator; each web app pins its own literal.
  'components.schemas.LoginDto.properties.app':
    'app discriminator; each web app pins its own literal',
  // Locale codes (en-US/vi-VN/en-VN) have no @arc/enums counterpart; the FE
  // derives language options from the locale prefix.
  'components.schemas.MarketplaceMarketResponseDto.properties.defaultLocale':
    'API locale set; no @arc/enums counterpart',
  'components.schemas.MarketplaceMarketResponseDto.properties.supportedLocales.items':
    'API locale set; no @arc/enums counterpart',
  // Account lifecycle status; no FE enum switches on it.
  'components.schemas.MeResponseDto.properties.status':
    'account lifecycle status; no @arc/enums counterpart',
  // Review moderation state only returned by seller/order review endpoints.
  'components.schemas.MyProductReviewResponseDto.properties.status':
    'API-only review moderation state',
  // Same moderation state as MyProductReviewResponseDto, other projection.
  'components.schemas.OrderReviewResponseDto.properties.status':
    'API-only review moderation state',
  // Response enum narrowed to the only shipping discount kind.
  'components.schemas.OrderShippingDiscountResponseDto.properties.benefit_type':
    'response subset of PromotionBenefitType (`free_shipping`)',
  // Request subset of ProductStates; draft/unavailable are server-owned.
  'components.schemas.ProductVariantConfigurationDto.properties.lifecycle_state':
    'request subset of ProductStates (no `draft`/`unavailable`)',
  // Recommendation carousel taxonomy, not user-selectable.
  'components.schemas.PublicProductRecommendationSectionResponseDto.properties.type':
    'API-only recommendation section taxonomy',
  // Same app discriminator as LoginDto.
  'components.schemas.ResetPasswordDto.properties.app':
    'app discriminator; each web app pins its own literal',
  // Same narrowed benefit type as the order shipping discount.
  'components.schemas.ShippingDiscountResponseDto.properties.benefit_type':
    'response subset of PromotionBenefitType (`free_shipping`)',
  // Readiness codes mirror ShippingProfileReadinessLabels keys but that export
  // is a label map, not an enum.
  'components.schemas.ShippingProfileResponseDto.properties.readiness_issues.items':
    'readiness codes; FE counterpart is a label map, not an enum',
  'components.schemas.ShippingRatePreviewResponseDto.properties.readiness_issues.items':
    'readiness codes; FE counterpart is a label map, not an enum',
  // Dashboard period selector; FE passes literal query strings.
  'components.schemas.ShopDashboardPeriodResponseDto.properties.range':
    'API-only dashboard period selector',
  // Settlement-currency change blockers, displayed as messages.
  'components.schemas.ShopSettlementCurrencyResponseDto.properties.blocked_reason':
    'API-only settlement currency blockers',
  // Refund attempt verbs, not a status enum.
  'components.schemas.UpdateShopOrderRefundDto.properties.action':
    'API-only refund action verbs',
  // Update payload intentionally forbids `archived`; FE sends ShippingProfileStatuses values.
  'components.schemas.UpdateShippingProfileDto.properties.status':
    'update-payload subset of ShippingProfileStatuses (no `archived`)',
  // Single-purpose token-type filter for the verify endpoint.
  'paths./v1/auth/verify-token.get.parameters.1':
    'single-value filter subset of TokenTypes (`resetPassword`)',
  // Order-list filter projection that also has `processing`, absent from OrderStatuses.
  'paths./v1/me/orders.get.parameters.5':
    'order-list filter projection, not OrderStatuses',
  // Review sort selector; FE passes literal query strings.
  'paths./v1/products/by-slug/{shop_slug}/{product_slug}/reviews.get.parameters.4':
    'API-only review sort selector',
  // Finance filters over transaction type/status, narrower than ledger kinds.
  'paths./v1/shops/{shop_id}/finance/transactions.get.parameters.3':
    'API-only finance transaction-type filter',
  'paths./v1/shops/{shop_id}/finance/transactions.get.parameters.4':
    'API-only finance transaction-status filter',
  // Dashboard period selector; FE passes literal query strings.
  'paths./v1/shops/{shop_id}/dashboard.get.parameters.1':
    'API-only dashboard period selector',
  // Order-export selectors mirror the ExportShopOrdersQueryDto fields.
  'paths./v1/shops/{shop_id}/orders/export.get.parameters.12':
    'API-only order-export date-range selector',
  'paths./v1/shops/{shop_id}/orders/export.get.parameters.14':
    'API-only order-export column preset',
  // Seller review moderation filter, displayed as a message.
  'paths./v1/shops/{shop_id}/reviews.get.parameters.3':
    'API-only review moderation filter',
  'paths./v1/shops/{shop_id}/reviews.get.parameters.5':
    'API-only review sort selector',
  // Lifecycle of a queued order export; FE reads it as plain strings.
  'components.schemas.ShopOrderExportResponseDto.properties.status':
    'API-only export job status lifecycle',
  // Public product-list sort selector; FE passes literal query strings.
  'paths./v1/products.get.parameters.10':
    'API-only product sort selector',
  'paths./v1/products/facets.get.parameters.10':
    'API-only product sort selector, shared with the list operation',
  // Why automatic payouts are blocked; FE renders the message, not the code.
  'components.schemas.ShopPayoutSettingsResponseDto.properties.auto_payout_ineligible_reason':
    'API-only payout eligibility reason codes',
  // Import job lifecycle; the UI renders status text, no FE enum exists.
  'components.schemas.ShopProductImportResponseDto.properties.status':
    'API-only import job status lifecycle',
  // Response projection of the CreateShopPromoCodeDto field; no FE enum reads it.
  'components.schemas.ShopPromoCodeResponseDto.properties.visibility':
    'API-only promo-code visibility',
  // Admin account lifecycle; the admin UI renders the value, no FE enum exists.
  'components.schemas.UserResponseDto.properties.status':
    'API-only user account status',
  'paths./v1/users/{id}.patch.requestBody.content.multipart/form-data.schema.properties.status':
    'same user account status on the multipart update body',
  'paths./v1/users/{id}.patch.requestBody.content.application/json.schema.properties.status':
    'same user account status on the JSON update body',
  // Manual refund state transitions; no admin UI sends or branches on them.
  'components.schemas.UpdateAdminOrderRefundDto.properties.action':
    'API-only refund transition verbs',
}

interface EnumCandidate {
  name: string
  values: readonly string[]
}

const feEnums: EnumCandidate[] = FE_ENUM_EXPORTS.map((name) => {
  const candidate = (arcEnums as unknown as Record<string, Record<string, string>>)[name]
  if (!candidate) throw new Error(`@arc/enums does not export ${name}`)
  return { name, values: Object.values(candidate) }
})

const specEnums = API_ENUM_VALUES as unknown as Record<string, readonly string[]>

function sameValueSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const set = new Set(left)
  return right.every((value) => set.has(value)) && set.size === right.length
}

function jaccard(left: readonly string[], right: readonly string[]): number {
  const a = new Set(left)
  const b = new Set(right)
  let intersection = 0
  for (const value of a) if (b.has(value)) intersection += 1
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function closestFeEnum(values: readonly string[]): { candidate: EnumCandidate, score: number } {
  return feEnums
    .map((candidate) => ({ candidate, score: jaccard(values, candidate.values) }))
    .sort((left, right) => right.score - left.score || left.candidate.name.localeCompare(right.candidate.name))[0]
}

describe('API enum conformance', () => {
  it('has an identical @arc/enums value set for every spec enum tuple', () => {
    const failures: string[] = []

    for (const [key, values] of Object.entries(specEnums)) {
      if (Object.prototype.hasOwnProperty.call(SPEC_ONLY_ENUMS, key)) continue
      if (feEnums.some((candidate) => sameValueSet(values, candidate.values))) continue

      const { candidate, score } = closestFeEnum(values)
      failures.push(
        `${key}\n` +
          `  spec values:            ${JSON.stringify(values)}\n` +
          `  closest @arc/enums:     ${candidate.name} = ${JSON.stringify(candidate.values)} ` +
          `(Jaccard ${score.toFixed(2)})\n` +
          `  add an enum to @arc/enums, or allowlist the key in SPEC_ONLY_ENUMS with a reason.`,
      )
    }

    expect(failures, `spec enum tuples without an identical @arc/enums value set:\n${failures.join('\n\n')}`).toEqual([])
  })

  it('keeps the SPEC_ONLY_ENUMS allowlist free of stale keys', () => {
    const stale = Object.keys(SPEC_ONLY_ENUMS).filter(
      (key) => !Object.prototype.hasOwnProperty.call(specEnums, key),
    )

    expect(stale, `allowlisted spec enum keys that no longer exist: ${stale.join(', ')}`).toEqual([])
  })
})
