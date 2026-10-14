type CarouselExposed = {
  $el?: unknown
};

/** Whole items a single prev/next click advances the track by. */
const ITEMS_PER_STEP = 2;

/**
 * Binds a UCarousel template ref and advances it by whole items.
 *
 * UCarousel's exposed `prev`/`next` page by the viewport width, which lands
 * mid-item and leaves a half card on the leading edge. The step here is
 * `ITEMS_PER_STEP` × the measured pitch — the distance between the first two
 * item starts, which includes the row's container gap — so every click leaves
 * the track aligned to item boundaries.
 *
 * Visibility comes from the real scroll boundaries through VueUse's `useScroll`
 * rather than UCarousel's exposed `page`/`pages`, which round the
 * viewport/item ratio.
 *
 * `itemCount` re-measures after the rendered slides change: a query that
 * repopulates the same row changes `scrollWidth` without resizing the viewport,
 * which a container ResizeObserver alone would miss.
 */
export function useCarouselControls(itemCount?: () => number) {
  const carousel = ref<CarouselExposed | null>(null);

  const container = computed<HTMLElement | null>(() => {
    if (!import.meta.client) {
      return null;
    }
    const el = carousel.value?.$el;
    const first = el instanceof HTMLElement ? el.firstElementChild : null;
    return first instanceof HTMLElement ? first : null;
  });

  const { arrivedState, measure } = useScroll(container);

  // Re-read boundaries after mount and whenever the track resizes or appears.
  useResizeObserver(container, () => measure());
  watch(container, () => measure(), { flush: 'post' });
  if (itemCount) {
    watch(itemCount, () => measure(), { flush: 'post' });
  }

  const scrollByItems = (direction: 1 | -1) => {
    const el = container.value;
    const slides = el ? Array.from(el.children) : [];
    const first = slides[0];
    const second = slides[1];
    // The pitch is the distance between slide starts: with the row spaced by a
    // container gap, an item's own width excludes that gap.
    const pitch = first instanceof HTMLElement && second instanceof HTMLElement
      ? second.offsetLeft - first.offsetLeft
      : (first instanceof HTMLElement ? first.clientWidth : 0);

    if (!el || !pitch) {
      return;
    }

    el.scrollBy({ left: direction * pitch * ITEMS_PER_STEP, behavior: 'smooth' });
  };

  return {
    carousel,
    canGoPrev: computed(() => !arrivedState.left),
    canGoNext: computed(() => !arrivedState.right),
    prev: () => scrollByItems(-1),
    next: () => scrollByItems(1),
  };
}
