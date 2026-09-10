import webpush from "web-push";

function ensureVapid() {
	const pub = process.env.VAPID_PUBLIC_KEY;
	const priv = process.env.VAPID_PRIVATE_KEY;
	const contact = process.env.VAPID_CONTACT_EMAIL ?? "admin@tgaw.app";
	if (pub && priv) {
		const subject = contact.startsWith("mailto:") ? contact : `mailto:${contact}`;
		try {
			webpush.setVapidDetails(subject, pub, priv);
		} catch (e) {
			console.error(
				"[ERROR] Invalid VAPID config:",
				e instanceof Error ? e.message : String(e),
			);
		}
	}
}

export async function sendPush(
	subscription: webpush.PushSubscription,
	title: string,
	body: string,
) {
	ensureVapid();
	if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
		console.error("[ERROR] VAPID keys missing — skipping push");
		return;
	}
	await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
}
