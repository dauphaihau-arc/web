import {
  describe, expect, it, vi,
} from 'vitest';
import { nextTick, ref, type Ref } from 'vue';
import { useSaleScheduleTimezone } from './use-sale-schedule-timezone';

/**
 * The store's own timezone, chosen so it can never coincide with the timezone
 * this host reports: that is what proves the default comes from the store.
 */
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const storeTimezone = browserTimezone === 'UTC' ? 'Asia/Tokyo' : 'UTC';

const shop = vi.hoisted(() => ({ data: undefined as unknown }));

vi.mock('~/domains/shop/queries/my-shop.query', () => ({
  useGetMyShop: () => ({ data: shop.data }),
}));

shop.data = ref<{ timezone: string } | undefined>(undefined);

function setStoreTimezone(timezone: string | undefined) {
  (shop.data as Ref<{ timezone: string } | undefined>).value = timezone
    ? { timezone }
    : undefined;
}

describe('useSaleScheduleTimezone', () => {
  it('defaults to the store timezone instead of the browser timezone', () => {
    setStoreTimezone(storeTimezone);

    const subject = useSaleScheduleTimezone();

    expect(storeTimezone).not.toBe(browserTimezone);
    expect(subject.timezone.value).toBe(storeTimezone);
    expect(subject.isStoreTimezone.value).toBe(true);
  });

  it('keeps a per-sale override once the seller chooses one', () => {
    setStoreTimezone(storeTimezone);

    const subject = useSaleScheduleTimezone();
    subject.openPicker();
    subject.timezone.value = 'America/New_York';

    expect(subject.timezone.value).toBe('America/New_York');
    expect(subject.isStoreTimezone.value).toBe(false);
  });

  it('does not overwrite a chosen override when the store timezone changes', async () => {
    setStoreTimezone(storeTimezone);

    const subject = useSaleScheduleTimezone();
    subject.openPicker();
    subject.timezone.value = 'America/New_York';
    setStoreTimezone('Europe/Paris');
    await nextTick();

    expect(subject.timezone.value).toBe('America/New_York');
    expect(subject.storeTimezone.value).toBe('Europe/Paris');
  });

  it('follows a store timezone change while no override was chosen', async () => {
    setStoreTimezone(storeTimezone);

    const subject = useSaleScheduleTimezone();
    setStoreTimezone('Europe/Paris');
    await nextTick();

    expect(subject.timezone.value).toBe('Europe/Paris');
    expect(subject.isStoreTimezone.value).toBe(true);
  });
});
