import { type BetterAuthOptions, betterAuth } from "better-auth"
import { createAccessControl } from "better-auth/plugins/access"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { haveIBeenPwned, openAPI } from "better-auth/plugins"
import { admin, customSession, twoFactor } from "better-auth/plugins"
import { MongoClient } from "mongodb"
import { sendEmail } from "@/lib/notifications/email"

// ---------------------------------------------------------------------------
// Custom Access Control for TGAW five-tier role system
// Better Auth's admin plugin requires all adminRoles to exist in `roles`.
// We map superadmin & leader to full admin permissions; the other roles are
// restricted (no destructive user-management actions).
// ---------------------------------------------------------------------------
const defaultStatements = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ] as const,
  session: ["list", "revoke", "delete"] as const,
}

const ac = createAccessControl(defaultStatements)

// Full admin powers — superadmin only
const superadminRole = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
})

// Leader: can ban/unban and view users but cannot set roles or impersonate
const leaderRole = ac.newRole({
  user: ["list", "ban", "get", "update"],
  session: ["list"],
})

// Restricted roles — no user-management permissions via the admin plugin
const restrictedRole = ac.newRole({
  user: [],
  session: [],
})

const client = new MongoClient(process.env.DATABASE_URL as string)
const db = client.db()

const options = {
  appName: "TGAW",
  database: mongodbAdapter(db, { client }),
  advanced: {
    database: {
      // Generate plain string ids so auth collections are queryable via
      // Prisma's `String @id @map("_id")` (Prisma cannot match native BSON
      // ObjectId ids). A custom function tells the mongo adapter to keep id
      // fields as strings instead of wrapping them in ObjectId.
      generateId: () => crypto.randomUUID(),
    },
  },
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
    sendVerificationEmail: async ({ user, url }) => {
      const verifyUrl = new URL(url);
      verifyUrl.searchParams.set("callbackURL", "/overview");
      await sendEmail(
        user.email,
        "Verify your TGAW email",
        `<p>Hi ${user.name},</p><p>Welcome to The Global Altar Watch. Click the link below to verify your email address and activate your account:</p><p><a href="${verifyUrl.toString()}">Verify email</a></p><p>If you didn't create an account, you can safely ignore this email.</p>`
      );
    },
    autoSignInAfterVerification: true,
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
    openAPI(),
    admin({
      defaultRole: "member",
      adminRole: ["superadmin"],
      roles: {
        superadmin: superadminRole,
        leader: leaderRole,
        board: restrictedRole,
        coordinator: restrictedRole,
        member: restrictedRole,
      },
    }),
    twoFactor(),
    haveIBeenPwned(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const superadminEmails = (process.env.SUPERADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          if (user.email && superadminEmails.includes(user.email.toLowerCase())) {
            return {
              data: {
                ...user,
                role: "superadmin",
              },
            };
          }
          return { data: user };
        },
      },
    },
  },
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
