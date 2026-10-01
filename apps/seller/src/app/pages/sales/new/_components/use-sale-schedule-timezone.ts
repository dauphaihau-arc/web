import { useGetMyShop } from '~/domains/shop/queries/my-shop.query';

/**
 * Owns the timezone a new Sale is scheduled in.
 *
 * A Sale defaults to the store's configured timezone, never the timezone of the
 * device that happens to be signed in, so a seller travelling or a staff member
 * elsewhere still schedules against the store's own clock. The selector stays
 * hidden behind an explicit override action; once the seller opens it their
 * choice wins and the store default stops being applied.
 */
export function useSaleScheduleTimezone() {
  const { data: myShop } = useGetMyShop();

  const storeTimezone = computed(() => myShop.value?.timezone ?? '');
  const timezone = ref('');
  const isPickerOpen = ref(false);

  watch(storeTimezone, (value) => {
    if (value && !isPickerOpen.value) {
      timezone.value = value;
    }
  }, { immediate: true });

  const isStoreTimezone = computed(() =>
    Boolean(timezone.value) && timezone.value === storeTimezone.value);

  function openPicker() {
    isPickerOpen.value = true;
  }

  return {
    storeTimezone,
    timezone,
    isPickerOpen,
    isStoreTimezone,
    openPicker,
  };
}
