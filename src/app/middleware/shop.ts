import { ROUTES } from '~/shared/config/enums/routes';
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status';
import { useGetMyShop } from '~/shared/server-state/shop';

function getStatusCode(error: unknown) {
  const fetchError = error as {
    response?: { status?: number }
    statusCode?: number
    status?: number
  };

  return fetchError.response?.status ?? fetchError.statusCode ?? fetchError.status;
}

export default defineNuxtRouteMiddleware(async () => {
  const { data, refetch } = useGetMyShop();

  if (data.value?.id) {
    return navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}`);
    // return navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.DASHBOARD}`);
  }

  try {
    const response = await refetch({ throwOnError: true });

    if (response.data?.id) {
      return navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}`);
      // return navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.DASHBOARD}`);
    }
  }
  catch (error) {
    if (getStatusCode(error) === 404) {
      return;
    }

    if (isBackendWakeUpError(error)) {
      void refetch();
      return;
    }
  }
});
