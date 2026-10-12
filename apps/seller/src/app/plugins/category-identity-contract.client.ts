import { enforceCategoryIdentityContract } from '@arc/lib';

/**
 * Category identifiers moved from internal ids to public decimal strings.
 * Persisted category state from an older contract is invalidated and the page
 * is reloaded before any request is issued under the stale semantics.
 *
 * Ordering: this plugin runs before the market store is created so it can clear
 * stale state before `useStorage` reads it.
 */
export default defineNuxtPlugin(() => {
  if (
    typeof window === 'undefined'
    || typeof sessionStorage === 'undefined'
    || typeof localStorage === 'undefined'
  ) {
    return;
  }

  enforceCategoryIdentityContract(
    { session: sessionStorage, local: localStorage },
    () => {
      window.location.reload();
    },
  );
});
