import { describe, expect, it } from "bun:test";
import type { GenericEndpointContext } from "better-auth";
import { preserveUserSetProfileOnLink } from "./oauthLinkProfileGuard";

function makeCtx({
	users,
	session = null,
	adapterError,
}: {
	users?: Array<{ name: string; image?: string | null }>;
	session?: unknown;
	adapterError?: boolean;
} = {}): GenericEndpointContext {
	const adapter = {
		findMany: async () => {
			if (adapterError) throw new Error("adapter exploded");
			return users ?? [];
		},
	};
	return {
		params: { id: "google" },
		context: {
			adapter,
			session,
		},
	} as unknown as GenericEndpointContext;
}

describe("preserveUserSetProfileOnLink", () => {
	it("applies provider image when the user has no avatar", async () => {
		const data = {
			name: "John Doe",
			image: "https://google.com/john.jpg",
			email: "john@example.com",
		};
		const ctx = makeCtx({ users: [{ name: "John Doe", image: null }] });
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data).toEqual(data);
	});

	it("preserves an existing avatar during OAuth sign-in", async () => {
		const data = {
			name: "John Doe",
			image: "https://google.com/john.jpg",
			email: "john@example.com",
		};
		const ctx = makeCtx({
			users: [
				{ name: "John Doe", image: "https://res.cloudinary.com/avatar.jpg" },
			],
		});
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data.image).toBeUndefined();
		expect(result.data.name).toBe("John Doe");
	});

	it("preserves a user-chosen display name", async () => {
		const data = {
			name: "John Doe",
			image: "https://google.com/john.jpg",
			email: "john@example.com",
		};
		const ctx = makeCtx({ users: [{ name: "John", image: null }] });
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data.name).toBeUndefined();
		expect(result.data.image).toBe("https://google.com/john.jpg");
	});

	it("does not touch updates made with an active session", async () => {
		const data = {
			name: "Jane",
			image: "https://new-avatar.jpg",
			email: "jane@example.com",
		};
		const ctx = makeCtx({
			users: [{ name: "Jane", image: null }],
			session: { user: { id: "u1" } },
		});
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data).toEqual(data);
	});

	it("passes through updates that carry no email", async () => {
		const data = { name: "Jane", image: "https://new-avatar.jpg" };
		const ctx = makeCtx({ users: [{ name: "Jane", image: null }] });
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data).toEqual(data);
	});

	it("passes through when no matching user is found", async () => {
		const data = {
			name: "John Doe",
			image: "https://google.com/john.jpg",
			email: "nobody@example.com",
		};
		const ctx = makeCtx({ users: [] });
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data).toEqual(data);
	});

	it("falls back to pass-through when the adapter throws", async () => {
		const data = {
			name: "John Doe",
			image: "https://google.com/john.jpg",
			email: "john@example.com",
		};
		const ctx = makeCtx({ adapterError: true });
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data).toEqual(data);
	});

	it("does not blank an empty provider name over a real stored name", async () => {
		const data = {
			name: "",
			image: "https://google.com/john.jpg",
			email: "john@example.com",
		};
		const ctx = makeCtx({ users: [{ name: "John", image: null }] });
		const result = await preserveUserSetProfileOnLink(data, ctx);
		expect(result.data.name).toBeUndefined();
		expect(result.data.image).toBe("https://google.com/john.jpg");
	});

	it("handles a null hook context", async () => {
		const data = {
			name: "John",
			image: "https://google.com/john.jpg",
			email: "john@example.com",
		};
		const result = await preserveUserSetProfileOnLink(data, null);
		expect(result.data).toEqual(data);
	});
});
