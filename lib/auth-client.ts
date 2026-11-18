import {
	adminClient,
	customSessionClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

// Auth requests must target the origin the browser is actually on.
// Omitting baseURL allows Better Auth to automatically use the current window.location.origin
// in the browser and relative `/api/auth` path.
// This prevents cross-origin 308 redirect CORS errors when the app is accessed on
// www.tgaw.app, preview environments, or localhost.
export const authClient = createAuthClient({
	plugins: [
		adminClient(),
		twoFactorClient(),
		customSessionClient<typeof auth>(),
	],
});

export const { signIn, signOut, signUp, useSession } = authClient;
