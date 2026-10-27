export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) {
    return;
  }

  const { status, waitForBackend } = useBackendStatus();

  if (status.value !== 'unknown') {
    return;
  }

  void waitForBackend();
});
