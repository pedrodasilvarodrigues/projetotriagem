/* Global worker for Portal Encaixe Web Push. Keep it framework-independent. */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "Você tem uma nova atualização." };
  }

  const title = payload.title || "Portal Encaixe";
  const options = {
    body: payload.body || "Você tem uma nova atualização.",
    tag: payload.tag || "portal-encaixe-notification",
    data: { url: typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/" },
    renotify: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url === targetUrl && "focus" in client);
      if (existingClient) return existingClient.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
