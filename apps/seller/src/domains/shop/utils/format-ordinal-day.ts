/**
 * Formats a day of the month with its ordinal suffix (`1st`, `2nd`, `3rd`,
 * `15th`). The API reports the auto payout day as a number.
 */
export function formatOrdinalDay(day: number) {
  const remainderOfTen = day % 10;
  const remainderOfHundred = day % 100;

  if (remainderOfTen === 1 && remainderOfHundred !== 11) {
    return `${day}st`;
  }

  if (remainderOfTen === 2 && remainderOfHundred !== 12) {
    return `${day}nd`;
  }

  if (remainderOfTen === 3 && remainderOfHundred !== 13) {
    return `${day}rd`;
  }

  return `${day}th`;
}
