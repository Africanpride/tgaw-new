import { type BetterAuthOptions, betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { haveIBeenPwned } from "better-auth/plugins"
import { admin, customSession, twoFactor } from "better-auth/plugins"
import { MongoClient } from "mongodb"
import { sendEmail } from "@/lib/notifications/email"

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
    sendResetPassword: async ({ user, url }) =>
      sendEmail(
        user.email,
        "Reset your TGAW password",
        `<p>Hi ${user.name},</p><p>We received a request to reset your password. Click the link below to choose a new one (this link expires shortly):</p><p><a href="${url}">Reset password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`
      ),
  },
  emailVerification: {
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendEmail(
        user.email,
        "Verify your TGAW email",
        `<p>Hi ${user.name},</p><p>Welcome to The Global Altar Watch. Click the link below to verify your email address and activate your account:</p><p><a href="${url}">Verify email</a></p><p>If you didn't create an account, you can safely ignore this email.</p>`
      ),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "microsoft"],
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  onAPIError: {
    errorURL: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/error`,
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
