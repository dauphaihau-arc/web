/**
 * One owner for the footer dialog's open state. Product and cart recovery
 * actions only ask the dialog to open; the key never leaves this module.
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
