import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

/**
 * Maps a coupon apply/pricing failure to the inline message the picker shows.
 * Unknown failures still surface a message so the picker never closes silently.
 */
export function resolveCouponErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    if (error.status === StatusCodes.NOT_FOUND) {
      return 'Coupon code not found';
    }
    if (error.status === StatusCodes.UNPROCESSABLE_ENTITY) {
      return error.data?.message ?? 'Coupon code cannot be applied';
    }
  }
  return 'Add coupon failed';
}
