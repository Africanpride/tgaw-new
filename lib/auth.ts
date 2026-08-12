import { type BetterAuthOptions, betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { haveIBeenPwned } from "better-auth/plugins"
import { admin, customSession, twoFactor } from "better-auth/plugins"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.DATABASE_URL as string)
const db = client.db()

const options = {
  appName: "TGAW",
  database: mongodbAdapter(db, { client }),
  session: {
    freshAge: 0,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "microsoft"],
    },
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: "common",
      prompt: "select_account",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin({
      defaultRole: "member",
      adminRole: ["admin"],
    }),
    twoFactor(),
    haveIBeenPwned(),
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      const extendedUser = user as typeof user & {
        onboardingComplete?: boolean
      }
      return {
        user: {
          ...user,
          image: user.image ?? null,
          hasPassword: !!(user as any).passwordHash,
          onboardingComplete: extendedUser.onboardingComplete ?? false,
        },
        session,
      }
    }, options),
  ],
})
