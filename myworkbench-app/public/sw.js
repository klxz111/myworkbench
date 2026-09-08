self.addEventListener('push', (event) => {
  let payload: Record<string, unknown> = {};
  try {
    payload = event.data ? JSON.parse(event.data.text()) : {};
  } catch {
    payload = {};
  }

  const title = (payload.title as string) || 'MyWorkbench';
  const options: NotificationOptions = {
    body: (payload.body as string) || '',
    icon: '/window.svg',
    badge: '/file.svg',
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification.data || {}) as Record<string, unknown>;
  const href = (data.href as string) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url === new URL(href, self.location.origin).href);
      if (existing) {
        return existing.navigate(href).then((c) => c.focus());
      }
      return self.clients.openWindow(href);
    })
  );
});
