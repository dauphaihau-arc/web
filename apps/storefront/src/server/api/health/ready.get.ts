export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  try {
    await $fetch('/health/ready', {
      baseURL: config.public.apiBaseURL,
      credentials: 'include',
      retry: 0,
      timeout: 10000,
    });

    return { ok: true };
  }
  catch (error) {
    const statusCode = (() => {
      const fetchError = error as {
        response?: { status?: number }
        statusCode?: number
        status?: number
      };

      return fetchError.response?.status ?? fetchError.statusCode ?? fetchError.status ?? 503;
    })();

    throw createError({
      statusCode,
      statusMessage: 'Backend not ready',
    });
  }
});
