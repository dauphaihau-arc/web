import type { PreferenceState } from './preference-options';
import { useUpdateCurrentUser } from '~/domains/me/mutations/update-current-user.mutation';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { invalidateMarketSensitiveQueries } from '~/domains/market/queries/market-sensitive-queries';
import type { AuthPreferences } from '~/domains/auth/api/contracts/auth-user.contract';

function buildPreferences({ currency, language, region }: PreferenceState): AuthPreferences {
  return {
    currency,
    language,
    region,
  };
}

export function useUpdateMarketPreferences() {
  const marketStore = useMarketStore();
  const queryClient = useQueryClient();
  const isSubmittingPreferences = ref(false);
  const { data: currentUserData } = useGetCurrentUser();

  const {
    mutateAsync: updateUserPreferences,
    isPending: isPendingUpdateUserPreferences,
  } = useUpdateCurrentUser();

  const isSavingPreferences = computed(() => {
    return isPendingUpdateUserPreferences.value || isSubmittingPreferences.value;
  });

  async function submitPreferences(state: PreferenceState) {
    if (isSubmittingPreferences.value) {
      return;
    }

    isSubmittingPreferences.value = true;
    const preferences = buildPreferences(state);

    try {
      if (currentUserData.value?.user) {
        await updateUserPreferences({
          preferences,
        });
      }

      marketStore.guestPreferences = preferences;

      await invalidateMarketSensitiveQueries(queryClient);

      return preferences;
    }
    finally {
      isSubmittingPreferences.value = false;
    }
  }

  return {
    isPendingUpdateUserPreferences,
    isSavingPreferences,
    isSubmittingPreferences,
    submitPreferences,
  };
}
