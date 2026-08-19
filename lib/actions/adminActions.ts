"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const resendVerificationSchema = z.object({
	email: z.string().email("Invalid email"),
});

/**
 * Re-sends the email verification message to a member who hasn't verified.
 * Superadmin only. Called WITHOUT an auth session so Better Auth falls into its
 * no-session path and looks the user up by email (with an authenticated session
 * it would reject any email that isn't the caller's own).
 */
export async function resendVerificationEmail(input: { email: string }) {
	const validation = resendVerificationSchema.safeParse(input);
	if (!validation.success) {
		return { success: false as const, error: "Invalid email" };
	}

	const session = await auth.api.getSession({ headers: await headers() });
	const role = (session?.user as { role?: string } | undefined)?.role;
	if (!session?.user || role !== "superadmin") {
		return { success: false as const, error: "Unauthorised" };
	}

	const email = validation.data.email;

	try {
		const target = await prisma.user.findUnique({
			where: { email },
			select: { emailVerified: true },
		});
		if (!target) {
			return { success: false as const, error: "User not found" };
		}
		if (target.emailVerified) {
			return { success: false as const, error: "Email is already verified" };
		}

		await auth.api.sendVerificationEmail({
			body: { email, callbackURL: "/overview" },
		});

		return { success: true as const };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to send verification email";
		return { success: false as const, error: message };
	}
}
