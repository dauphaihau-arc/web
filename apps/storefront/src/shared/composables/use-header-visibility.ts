/**
 * Whether the market header is currently revealed. The header hides itself
 * while the shopper scrolls down, so sticky page toolbars read this to sit
 * flush against the viewport top instead of leaving a header-sized gap.
 */
export function useHeaderVisibility() {
  return useState<boolean>('market-header-visible', () => true);
}
