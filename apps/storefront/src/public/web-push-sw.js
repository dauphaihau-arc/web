import { getNotificationTargetPath } from '/web-push-routing.js';

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const notificationTitle = payload.title || 'Notification';
  const notificationOptions = {
    body: payload.body || '',
    data: payload.data || {},
    icon: '/favicon.png',
    badge: '/favicon.png',
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = getNotificationTargetPath(event.notification.data || {});

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find(client => 'focus' in client);

        if (existingClient) {
          existingClient.focus();
          return existingClient.navigate(targetPath);
        }

        return self.clients.openWindow(targetPath);
      })
  );
});
