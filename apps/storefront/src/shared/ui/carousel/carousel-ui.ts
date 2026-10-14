/**
 * Nuxt UI UCarousel `ui` overrides for product/category sections.
 *
 * Below `xl` the track is full-bleed: the scroll container spans the viewport
 * and owns the page gutter as inline padding with matching
 * `scroll-padding-inline`, so the first slide starts on the heading gutter and
 * neighbouring slides stay visible in the gutters while scrolling. Item widths
 * keep their fluid mobile/tablet sizing there, which is what makes that peek
 * possible.
 *
 * From `xl` the home layout reaches `max-w-home-layout`, so the section wrapper
 * carries the gutter (`xl:px-16`) and the container drops its inline padding.
 * Slides are then sized so that `n` of them plus the `(n-1)` gaps fill the
 * wrapper content box exactly: the row ends on the last image, with no leftover
 * strip — not at the row's start, not mid-row, and not at the end of the track
 * where a trailing per-item gutter would otherwise stay visible.
 *
 * Spacing lives in the container's `gap-4` rather than each item's trailing
 * padding, so the scrollable content ends at the last image. The pitch that
 * `useCarouselControls` steps by is therefore the distance between two item
 * starts, not an item's `clientWidth`.
 */
const containerGutter = 'gap-4 px-4 md:px-12 lg:px-16 scroll-px-4 md:scroll-px-12 lg:scroll-px-16 xl:px-0 xl:scroll-px-0';

const itemBase = 'min-w-0 shrink-0 grow-0 snap-start';

export const productCarouselUi = {
  container: containerGutter,
  item: `w-[38%] md:w-[240px] xl:w-[calc((100%-4rem)/5)] ${itemBase}`,
};

export const categoryCarouselUi = {
  container: containerGutter,
  item: `w-[30%] sm:w-[20%] md:w-[168px] xl:w-[calc((100%-6rem)/7)] ${itemBase}`,
};

export const circleCategoryCarouselUi = {
  container: containerGutter,
  item: `w-[28%] sm:w-[18%] md:w-[120px] xl:w-[calc((100%-9rem)/10)] ${itemBase}`,
};
