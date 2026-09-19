import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { sendPush } from "@/lib/notifications/push";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { resolveUserLocale } from "@/lib/notifications/locale";

export { resolveUserLocale };

type NotificationType =
	| "NEW_MESSAGE"
	| "NEW_COMMENT"
	| "NEW_LIKE"
	| "NEW_FOLLOWER"
	| "GROUP_INVITE"
	| "PRAYER_UPDATE"
	| "SLOT_REMINDER"
	| "ADMIN_BROADCAST";

interface DispatchParams {
	userId: string;
	type: NotificationType;
	title: string;
	body: string;
	link?: string;
}

interface NotificationPrefs {
	email?: Record<string, boolean>;
	push?: Record<string, boolean>;
}

function isEnabled(prefs: NotificationPrefs | null, channel: "email" | "push", type: string) {
	const map = prefs?.[channel];
	if (!map) return true;
	const value = map[type];
	return value === undefined ? true : value;
}

export async function dispatchNotification(params: DispatchParams) {
	const { userId, type, title, body, link } = params;

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return;

	// Locale-aware touchpoint (§7): resolve the recipient's preferred locale.
	// Titles/bodies are still built by callers; the locale is carried here for
	// log context so future template localization can use it without rewrites.
	let recipientLocale = DEFAULT_LOCALE;
	try {
		const pref = (user as { preferredLocale?: unknown }).preferredLocale;
		if (isLocale(pref)) {
			recipientLocale = pref;
		} else {
			recipientLocale = await resolveUserLocale(userId);
		}
	} catch {
		recipientLocale = DEFAULT_LOCALE;
	}

	const prefs = (user.notificationPrefs ?? null) as NotificationPrefs | null;
	const emailEnabled = isEnabled(prefs, "email", type);
	const pushEnabled = isEnabled(prefs, "push", type);

	const tasks: Promise<void>[] = [];

	if (emailEnabled) {
		tasks.push(
			(async () => {
				try {
					await prisma.notification.create({
						data: { userId, type, channel: "EMAIL", title, body, link },
					});
				} catch (e) {
					console.error(`[ERROR] Failed to create EMAIL notification for ${userId} (locale=${recipientLocale})`, e instanceof Error ? e.message : String(e));
				}
				if (user.email) {
					try {
						await sendEmail(user.email, title, `<p>${body}</p>`);
					} catch {
						console.error(`[ERROR] Failed to send email to ${user.email}`);
					}
				}
			})(),
		);
	}

	if (pushEnabled) {
		tasks.push(
			(async () => {
				try {
					await prisma.notification.create({
						data: { userId, type, channel: "PUSH", title, body, link },
					});
				} catch (e) {
					console.error(`[ERROR] Failed to create PUSH notification for ${userId} (locale=${recipientLocale})`, e instanceof Error ? e.message : String(e));
				}
				const subscriptions = await prisma.pushSubscription.findMany({
					where: { userId },
				});
				if (subscriptions.length > 0) {
					const results = await Promise.allSettled(
						subscriptions.map((sub) =>
							sendPush(
								{
									endpoint: sub.endpoint,
									keys: { p256dh: sub.p256dh, auth: sub.auth },
								},
								title,
								body,
							),
						),
					);
					for (const r of results) {
						if (r.status === "rejected") {
							const err = r.reason as unknown;
							// 410 Gone = subscription expired/invalid -> clean up
							const statusCode = typeof err === "object" && err !== null && "statusCode" in err ? (err as { statusCode: number }).statusCode : undefined;
							if (statusCode === 410 || statusCode === 404) {
								// best-effort cleanup logged, subscription will be removed on next POST dedup
								console.error(`[ERROR] Push subscription gone (status ${statusCode})`);
							} else {
								console.error(`[ERROR] Failed to send push`, err instanceof Error ? err.message : String(err));
							}
						}
					}
				}
			})(),
		);
	}

	// If both channels disabled, still persist a single in-app notification for audit (EMAIL as fallback) so UI shows it
	if (tasks.length === 0) {
		try {
			await prisma.notification.create({
				data: { userId, type, channel: "EMAIL", title, body, link },
			});
		} catch (e) {
			console.error(`[ERROR] Failed to create fallback notification for ${userId}`, e instanceof Error ? e.message : String(e));
		}
		return;
	}

	await Promise.allSettled(tasks);
}
