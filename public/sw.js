self.addEventListener("push", (event) => {
	const data = event.data?.json() ?? {
		title: "TGAW",
		body: "New notification",
	};
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: "/images/icon-192.png",
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(clients.openWindow("/"));
});
