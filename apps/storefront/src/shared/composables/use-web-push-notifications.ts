import { meNotificationApi } from '~/shared/api/me/notifications/notification.api';

type BrowserNotificationStatus =
  | 'unsupported'
  | 'idle'
  | 'syncing'
  | 'enabled'
  | 'disabled'
  | 'blocked'
  | 'error';

function base64UrlToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = window.atob(base64);

  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

function normalizePermission(): NotificationPermission {
  if (!import.meta.client || typeof Notification === 'undefined') {
    return 'default';
  }

  return Notification.permission;
}

export function useWebPushNotifications() {
  const status = useState<BrowserNotificationStatus>('web-push-status', () =>
    import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window ?
      'idle' :
      'unsupported'
  );
  const permission = useState<NotificationPermission>('web-push-permission', normalizePermission);

  const isSupported = computed(() => status.value !== 'unsupported');
  const isEnabled = computed(() => status.value === 'enabled');

  async function ensureServiceWorkerRegistration() {
    if (!import.meta.client || !isSupported.value) {
      return null;
    }

    const existing = await navigator.serviceWorker.getRegistration('/web-push-sw.js');
    if (existing) {
      return existing;
    }

    return navigator.serviceWorker.register('/web-push-sw.js', {
      type: 'module',
    });
  }

  async function getExistingSubscription() {
    const registration = await ensureServiceWorkerRegistration();
    return registration?.pushManager.getSubscription() ?? null;
  }

  async function syncStatusFromBrowser() {
    permission.value = normalizePermission();

    if (!isSupported.value) {
      status.value = 'unsupported';
      return;
    }

    if (permission.value === 'denied') {
      status.value = 'blocked';
      return;
    }

    const subscription = await getExistingSubscription();

    if (permission.value === 'granted' && subscription) {
      status.value = 'enabled';
      return;
    }

    status.value = 'disabled';
  }

  async function syncSubscriptionWithServer() {
    if (!isSupported.value) {
      status.value = 'unsupported';
      return false;
    }

    permission.value = normalizePermission();
    if (permission.value !== 'granted') {
      status.value = permission.value === 'denied' ? 'blocked' : 'disabled';
      return false;
    }

    const subscription = await getExistingSubscription();

    if (!subscription) {
      status.value = 'disabled';
      return false;
    }

    status.value = 'syncing';

    await meNotificationApi.registerWebPushSubscription(subscription.toJSON() as {
      endpoint: string
      keys: { p256dh: string, auth: string }
    });

    status.value = 'enabled';
    return true;
  }

  async function enable() {
    if (!isSupported.value) {
      status.value = 'unsupported';
      return false;
    }

    permission.value = await Notification.requestPermission();
    if (permission.value !== 'granted') {
      status.value = permission.value === 'denied' ? 'blocked' : 'disabled';
      return false;
    }

    status.value = 'syncing';

    const publicKeyResponse = await meNotificationApi.getWebPushPublicKey();
    if (!publicKeyResponse.enabled || !publicKeyResponse.public_key) {
      status.value = 'error';
      throw new Error('Web Push is not configured on the server.');
    }

    const registration = await ensureServiceWorkerRegistration();
    if (!registration) {
      status.value = 'unsupported';
      return false;
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publicKeyResponse.public_key),
      });
    }

    await meNotificationApi.registerWebPushSubscription(subscription.toJSON() as {
      endpoint: string
      keys: { p256dh: string, auth: string }
    });

    status.value = 'enabled';
    return true;
  }

  async function disable() {
    if (!isSupported.value) {
      status.value = 'unsupported';
      return false;
    }

    const subscription = await getExistingSubscription();
    if (!subscription) {
      status.value = 'disabled';
      return false;
    }

    status.value = 'syncing';

    await meNotificationApi.unregisterWebPushSubscription({
      endpoint: subscription.endpoint,
    });

    await subscription.unsubscribe();
    permission.value = normalizePermission();
    status.value = permission.value === 'denied' ? 'blocked' : 'disabled';

    return true;
  }

  return {
    status,
    permission,
    isSupported,
    isEnabled,
    syncStatusFromBrowser,
    syncSubscriptionWithServer,
    enable,
    disable,
  };
}
