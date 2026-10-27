export const FILTER_CHIP_SUMMARY_LIMIT = 4

/**
 * Chips stay one line: show the first few selected labels and count the rest.
 * e.g. “A, B, C, D + 1 more”.
 */
export function summarizeFilterLabels(labels: readonly string[]): string {
  if (labels.length <= FILTER_CHIP_SUMMARY_LIMIT) {
    return labels.join(', ')
  }

  const shown = labels.slice(0, FILTER_CHIP_SUMMARY_LIMIT).join(', ')
  const remaining = labels.length - FILTER_CHIP_SUMMARY_LIMIT

  return `${shown} + ${remaining} more`
}
