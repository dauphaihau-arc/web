import { z } from 'zod';
import { PromotionProductScope } from '@arc/enums/promotion';

/**
 * The Product targeting fields a Sale and a Promo Code form both carry.
 *
 * Both forms scope a Promotion to every Product or to chosen ones, so the field
 * definitions live here once and cannot drift apart.
 */
export const promotionProductFields = {
  product_scope: z.nativeEnum(PromotionProductScope),
  product_ids: z.array(z.string()),
};

/**
 * The scheduling fields a Sale and a Promo Code form both carry.
 *
 * A Promotion's schedule is a local wall clock plus the timezone that clock
 * belongs to, so the same contract validates both forms.
 */
export const promotionScheduleFields = {
  timezone: z.string().min(1, 'Choose a timezone.'),
  start_mode: z.enum(['now', 'scheduled']),
  start_local: z.string(),
  end_local: z.string(),
  start_occurrence: z.enum(['earlier', 'later']).optional(),
  end_occurrence: z.enum(['earlier', 'later']).optional(),
};
