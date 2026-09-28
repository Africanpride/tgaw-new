"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

function newFeedToken(): string {
	return randomBytes(32).toString("base64url");
}

async function requireUserId(): Promise<string> {
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session?.user?.id;
	if (!userId) throw new Error("Unauthorised");
	return userId;
}

/** Create the token on first use so users who never sync write nothing. */
export async function ensureCalendarFeedToken(): Promise<string> {
	const userId = await requireUserId();
	const existing = await prisma.user.findUnique({
		where: { id: userId },
		select: { calendarFeedToken: true },
	});
	if (existing?.calendarFeedToken) return existing.calendarFeedToken;

	const token = newFeedToken();
	await prisma.user.update({
		where: { id: userId },
		data: { calendarFeedToken: token },
	});
	return token;
}

/** Invalidate the previous link immediately and return the replacement. */
export async function regenerateCalendarFeedToken(): Promise<string> {
	const userId = await requireUserId();
	const token = newFeedToken();
	await prisma.user.update({
		where: { id: userId },
		data: { calendarFeedToken: token },
	});
	return token;
}
