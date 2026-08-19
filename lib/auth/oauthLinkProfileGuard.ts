import type { GenericEndpointContext } from "better-auth";

type UserUpdateData = Partial<Record<string, unknown>>;

/**
 * Guards Better Auth's `socialProviders.*.overrideUserInfoOnSignIn` profile
 * sync so an OAuth sign-in never clobbers a user's own choices.
 *
 * When an existing user signs in via a social provider, Better Auth re-copies
 * the provider's `name` and `image` (plus `email`) onto the user. That update
 * is the only user update that (a) carries a profile image/name, (b) runs
 * with no active session (it happens during the OAuth callback, before any
 * session exists), and (c) carries the user's `email`. We use that combination
 * to detect the sync and drop the fields the user intentionally set
 * themselves:
 *
 * - `image` is preserved when the stored user already has an avatar.
 * - `name` is preserved when the stored name differs from the provider's
 *   (i.e. the user chose their own display name).
 *
 * Every other update (manual profile edits, admin changes, the change-email
 * flow, etc.) runs with a session and passes through untouched. All database
 * access is guarded so a failure here never aborts the OAuth sign-in.
 */
export async function preserveUserSetProfileOnLink(
	data: UserUpdateData,
	ctx: GenericEndpointContext | null,
): Promise<{ data: UserUpdateData }> {
	if (!ctx?.context || ctx.context.session) return { data };
	if (typeof data.email !== "string" || data.email.length === 0)
		return { data };
	if (!("image" in data) && !("name" in data)) return { data };

	try {
		const users = await ctx.context.adapter.findMany<{
			name: string;
			image?: string | null;
		}>({
			model: "user",
			where: [{ field: "email", value: data.email.toLowerCase() }],
			limit: 1,
		});
		const existing = users?.[0];
		if (!existing) return { data };

		const next = { ...data };
		let strippedImage = false;
		let strippedName = false;
		if (
			"image" in data &&
			typeof existing.image === "string" &&
			existing.image.length > 0
		) {
			delete next.image;
			strippedImage = true;
		}
		if (
			"name" in data &&
			typeof existing.name === "string" &&
			existing.name.length > 0 &&
			existing.name !== data.name
		) {
			delete next.name;
			strippedName = true;
		}
		if (strippedImage || strippedName) {
			console.log(
				`[AUTH] preserveUserSetProfileOnLink kept user-set ${[
					strippedImage && "image",
					strippedName && "name",
				]
					.filter(Boolean)
					.join(" and ")} for ${data.email}`,
			);
		}
		return { data: next };
	} catch (error) {
		console.error("[ERROR] preserveUserSetProfileOnLink", error);
		return { data };
	}
}
