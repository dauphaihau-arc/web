/**
 * Shared open state for the market preferences dialog. The footer owns the
 * only dialog instance; product and cart recovery actions only ask for it to
 * open instead of mounting another copy.
 */
export function useMarketPreferencesDialog() {
  const isOpen = useState<boolean>('market-preferences-dialog-open', () => false);

  function open() {
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  return {
    isOpen,
    open,
    close,
  };
}
