"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { prisma } from "@/lib/db/prisma";

const notificationPrefsSchema = z.object({
	email: z.record(z.string(), z.boolean()),
	push: z.record(z.string(), z.boolean()),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(8, "Use at least 8 characters"),
});

const deleteAccountSchema = z.object({
	password: z.string().min(1, "Enter your password to confirm"),
});

export async function changePassword(input: {
	currentPassword: string;
	newPassword: string;
}) {
	const validation = changePasswordSchema.safeParse(input);
	if (!validation.success) {
		return {
			success: false as const,
			error: validation.error.issues[0]?.message || "Validation failed",
		};
	}

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	try {
		await auth.api.changePassword({
			body: {
				currentPassword: validation.data.currentPassword,
				newPassword: validation.data.newPassword,
				revokeOtherSessions: true,
			},
			headers: await headers(),
		});
		return { success: true as const };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Could not delete account";
		return { success: false as const, error: message };
	}
}

const setPasswordSchema = z.object({
	newPassword: z.string().min(8, "Use at least 8 characters"),
});

export async function setPassword(input: { newPassword: string }) {
	const validation = setPasswordSchema.safeParse(input);
	if (!validation.success) {
		return {
			success: false as const,
			error: validation.error.issues[0]?.message || "Validation failed",
		};
	}

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	try {
		await auth.api.setPassword({
			body: {
				newPassword: validation.data.newPassword,
			},
			headers: await headers(),
		});
		return { success: true as const };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Could not set password";
		return { success: false as const, error: message };
	}
}

export async function listSessions() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	const sessions = await auth.api.listSessions({ headers: await headers() });
	return { success: true as const, sessions };
}

export async function revokeSession(token: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	await auth.api.revokeSession({
		body: { token },
		headers: await headers(),
	});
	return { success: true as const };
}

export async function revokeOtherSessions() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	await auth.api.revokeOtherSessions({ headers: await headers() });
	return { success: true as const };
}

export async function getNotificationPrefs() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	const user = await prisma.user.findUnique({
		where: { id: session.user.id! },
		select: { notificationPrefs: true },
	});
	return { success: true as const, prefs: user?.notificationPrefs ?? null };
}

export async function saveNotificationPrefs(input: NotificationPrefs) {
	const validation = notificationPrefsSchema.safeParse(input);
	if (!validation.success) {
		return { success: false as const, error: "Invalid preferences" };
	}

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	await prisma.user.update({
		where: { id: session.user.id! },
		data: { notificationPrefs: validation.data },
	});

	revalidatePath("/settings");
	return { success: true as const };
}

export async function deleteAccount(input: { password: string }) {
	const validation = deleteAccountSchema.safeParse(input);
	if (!validation.success) {
		return {
			success: false as const,
			error: "Enter your password to confirm deletion",
		};
	}

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	const userId = session.user.id!;

	try {
		await prisma.$transaction(async (tx) => {
			await tx.pushSubscription.deleteMany({ where: { userId } });
			await tx.notification.deleteMany({ where: { userId } });
			await tx.report.deleteMany({ where: { reporterId: userId } });
			await tx.follow.deleteMany({
				where: { OR: [{ followerId: userId }, { followingId: userId }] },
			});
			await tx.eventBooking.deleteMany({ where: { userId } });
			await tx.event.deleteMany({ where: { userId } });

			const ownedGroups = await tx.group.findMany({
				where: { ownerId: userId },
				select: { id: true },
			});
			const ownedGroupIds = ownedGroups.map((g) => g.id);
			await tx.conversation.deleteMany({
				where: { groupId: { in: ownedGroupIds } },
			});
			await tx.group.deleteMany({ where: { id: { in: ownedGroupIds } } });

			await tx.groupMember.deleteMany({ where: { userId } });

			const memberConversations = await tx.conversation.findMany({
				where: { memberIds: { has: userId } },
				select: { id: true, memberIds: true },
			});
			for (const conv of memberConversations) {
				await tx.conversation.update({
					where: { id: conv.id },
					data: { memberIds: conv.memberIds.filter((id) => id !== userId) },
				});
			}

			await tx.comment.deleteMany({ where: { authorId: userId } });
			await tx.like.deleteMany({ where: { userId } });
			await tx.pollOption.deleteMany({ where: { voterIds: { has: userId } } });
			await tx.poll.deleteMany({
				where: { post: { authorId: userId } },
			});
			await tx.post.deleteMany({ where: { authorId: userId } });
			await tx.message.deleteMany({ where: { senderId: userId } });
		});
	} catch (err) {
		console.error("[ERROR] Failed to clean up account data", err);
		return {
			success: false as const,
			error: "Could not finish cleaning up your data",
		};
	}

	try {
		await auth.api.deleteUser({
			body: { password: validation.data.password },
			headers: await headers(),
		});
		return { success: true as const };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Could not delete account";
		if (message.toLowerCase().includes("password")) {
			return { success: false as const, error: "Incorrect password" };
		}
		return { success: false as const, error: message };
	}
}

const updateProfileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	phone: z
		.string()
		.min(7, "Enter a valid phone number")
		.regex(/^\+?[0-9\s-]+$/, "Digits only, may start with +"),
	country: z.string().min(1, "Select a country"),
	sex: z.enum(["male", "female"], { message: "Select an option" }),
	ageRange: z.enum(
		["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65-plus"],
		{ message: "Select an age range" }
	),
	timezone: z.string().min(1, "Select your time zone"),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export async function getProfile() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id! },
	});

	return {
		success: true as const,
		name: session.user.name ?? "",
		profile: profile
			? {
					phone: profile.phone,
					country: profile.country,
					sex: profile.sex as "male" | "female",
					ageRange: profile.ageRange as UpdateProfileValues["ageRange"],
					timezone: profile.timezone,
				}
			: null,
	};
}

export async function updateProfile(input: UpdateProfileValues) {
	const validation = updateProfileSchema.safeParse(input);
	if (!validation.success) {
		return {
			success: false as const,
			error: validation.error.issues[0]?.message || "Validation failed",
		};
	}

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { success: false as const, error: "Unauthorised" };

	const userId = session.user.id!;
	const { name, phone, country, sex, ageRange, timezone } = validation.data;

	try {
		await authClient.updateUser({ name });
	} catch {
		// OAuth users may not have a Prisma User record — continue
	}

	const existing = await prisma.userProfile.findUnique({
		where: { userId },
	});

	if (existing) {
		await prisma.userProfile.update({
			where: { userId },
			data: { phone, country, sex, ageRange, timezone },
		});
	} else {
		await prisma.userProfile.create({
			data: { userId, phone, country, sex, ageRange, timezone },
		});
	}

	revalidatePath("/settings");
	return { success: true as const };
}