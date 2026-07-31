import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { twoFactorClient } from "better-auth/client/plugins"
import { customSessionClient } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [adminClient(), twoFactorClient(), customSessionClient<typeof auth>()],
})

export const { signIn, signOut, signUp, useSession } = authClient
