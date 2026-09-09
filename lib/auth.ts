import { type BetterAuthOptions, betterAuth } from "better-auth"
import { createAccessControl } from "better-auth/plugins/access"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { haveIBeenPwned, openAPI } from "better-auth/plugins"
import { admin, customSession, twoFactor } from "better-auth/plugins"
import { MongoClient } from "mongodb"
import { sendEmail } from "@/lib/notifications/email"
import { preserveUserSetProfileOnLink } from "@/lib/auth/oauthLinkProfileGuard"

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

// MongoDB client with connection pooling to prevent memory leaks
const client = new MongoClient(process.env.DATABASE_URL as string, {
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 60000,
  waitQueueTimeoutMS: 10000,
})
const db = client.db()

// Export for graceful shutdown
export const mongoClient = client

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
  rateLimit: {
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 600, max: 5 },
      "/sign-up/email": { window: 3600, max: 3 },
      "/request-password-reset": { window: 3600, max: 3 },
      "/verify-email": { window: 3600, max: 5 },
      "/two-factor/verify": { window: 300, max: 5 },
    },
    storage: "database",
  },
  session: {
    freshAge: 0,
    updateAge: 86400,
    expiresIn: 604800,
    cookieCache: { enabled: true, maxAge: 300 },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) =>
      sendEmail(
        user.email,
        "Reset your TGAW password",
        `<p>Hi ${user.name},</p><p>We received a request to reset your password. This link expires in 1 hour — click below to choose a new one:</p><p><a href="${url}">Reset password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`
      ),
  },
  emailVerification: {
    sendOnSignIn: true,
    expiresIn: 86400,
    sendVerificationEmail: async ({ user, url }) => {
      const verifyUrl = new URL(url);
      verifyUrl.searchParams.set("callbackURL", "/overview");
      await sendEmail(
        user.email,
        "Verify your TGAW email",
        `<p>Hi ${user.name},</p><p>Welcome to The Global Altar Watch. Click the link below to verify your email address and activate your account (expires in 24 hours):</p><p><a href="${verifyUrl.toString()}">Verify email</a></p><p>If you didn't create an account, you can safely ignore this email.</p>`
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
      // Re-copy the provider's name/avatar onto an existing user on every
      // OAuth sign-in (not just the first link). This also heals accounts that
      // were linked before the sync existed. The update.before hook below
      // keeps any avatar/name the user set for themselves.
      overrideUserInfoOnSignIn: true,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      overrideUserInfoOnSignIn: true,
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
    twoFactor({
      otpOptions: { period: 30 },
      backupCodeOptions: { amount: 10, length: 10 },
    }),
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
      update: {
        before: async (user, context) => {
          const res = await preserveUserSetProfileOnLink(user, context);
          try {
            const uData = (res && typeof res === "object" && "data" in res && res.data) ? res.data : user;
            const targetId = (uData as Record<string, unknown>)?.id ?? (context as unknown as { body?: { userId?: string } })?.body?.userId ?? (context as unknown as { params?: { userId?: string } })?.params?.userId;
            if (targetId && typeof targetId === "string" && ("role" in (uData as Record<string, unknown>) || "banned" in (uData as Record<string, unknown>))) {
              const { prisma } = await import("@/lib/db/prisma");
              const existing = await prisma.user.findUnique({
                where: { id: targetId },
                select: { id: true, email: true, role: true, banned: true, banReason: true, banExpires: true },
              });
              if (existing && context) {
                (context as unknown as Record<string, unknown>).__auditPrevUser = existing;
              }
            }
          } catch {}
          return res;
        },
        after: async (user, context) => {
          try {
            const { logAudit, extractRequestContext } = await import("@/lib/services/auditService");
            const u = user as unknown as { id: string; email: string; role?: string; banned?: boolean; banReason?: string; banExpires?: Date };
            const prev = (context as unknown as Record<string, unknown>)?.__auditPrevUser as { id: string; email: string; role?: string; banned?: boolean; banReason?: string; banExpires?: Date } | undefined;

            const actorId = (context as unknown as { session?: { user?: { id?: string; role?: string } } })?.session?.user?.id ?? u.id;
            const actorRole = (context as unknown as { session?: { user?: { id?: string; role?: string } } })?.session?.user?.role ?? (u.role ?? null);
            const reqCtx = (context as unknown as { request?: Request })?.request ? extractRequestContext((context as unknown as { request: Request }).request) : { ip: null, userAgent: null };

            if (prev && prev.id === u.id) {
              if (prev.role && u.role && prev.role !== u.role) {
                await logAudit({
                  actorId,
                  actorRole,
                  action: "USER_ROLE_CHANGE",
                  targetType: "User",
                  targetId: u.id,
                  metadata: { before: prev.role, after: u.role, email: u.email },
                  ip: reqCtx.ip,
                  userAgent: reqCtx.userAgent,
                });
              }
              if (!prev.banned && u.banned) {
                await logAudit({
                  actorId,
                  actorRole,
                  action: "USER_BAN",
                  targetType: "User",
                  targetId: u.id,
                  metadata: { reason: u.banReason ?? null, banExpires: u.banExpires ?? null, email: u.email },
                  ip: reqCtx.ip,
                  userAgent: reqCtx.userAgent,
                });
              } else if (prev.banned && !u.banned) {
                await logAudit({
                  actorId,
                  actorRole,
                  action: "USER_UNBAN",
                  targetType: "User",
                  targetId: u.id,
                  metadata: { email: u.email },
                  ip: reqCtx.ip,
                  userAgent: reqCtx.userAgent,
                });
              }
            } else if ((context as unknown as { body?: { role?: string } })?.body?.role && u.role) {
              await logAudit({
                actorId,
                actorRole,
                action: "USER_ROLE_CHANGE",
                targetType: "User",
                targetId: u.id,
                metadata: { after: u.role, email: u.email },
                ip: reqCtx.ip,
                userAgent: reqCtx.userAgent,
              });
            }
          } catch {}
        },
      },
      delete: {
        after: async (user, context) => {
          try {
            const { logAudit, extractRequestContext } = await import("@/lib/services/auditService");
            const u = user as unknown as { id: string; email: string; role?: string };
            const actorId = (context as unknown as { session?: { user?: { id?: string; role?: string } } })?.session?.user?.id ?? u.id;
            const actorRole = (context as unknown as { session?: { user?: { id?: string; role?: string } } })?.session?.user?.role ?? (u.role ?? null);
            const reqCtx = (context as unknown as { request?: Request })?.request ? extractRequestContext((context as unknown as { request: Request }).request) : { ip: null, userAgent: null };
            await logAudit({
              actorId,
              actorRole,
              action: "USER_DELETE",
              targetType: "User",
              targetId: u.id,
              metadata: { email: u.email },
              ip: reqCtx.ip,
              userAgent: reqCtx.userAgent,
            });
          } catch {}
        },
      },
    },
    session: {
      create: {
        after: async (session, context) => {
          try {
            const { logAudit, extractRequestContext } = await import("@/lib/services/auditService");
            const actorId = (session as unknown as { userId: string }).userId ?? "unknown";
            const reqCtx = (context as unknown as { request?: Request })?.request ? extractRequestContext((context as unknown as { request: Request }).request) : { ip: null, userAgent: null };
            await logAudit({
              actorId,
              action: "AUTH_LOGIN_SUCCESS",
              targetType: "Auth",
              targetId: (session as unknown as { id: string }).id ?? "session",
              metadata: { sessionId: (session as unknown as { id: string }).id },
              ip: reqCtx.ip,
              userAgent: reqCtx.userAgent,
            });
          } catch {}
        },
      },
      delete: {
        after: async (session, context) => {
          try {
            const { logAudit, extractRequestContext } = await import("@/lib/services/auditService");
            const s = session as unknown as { userId?: string; id?: string };
            if (s?.userId) {
              const reqCtx = (context as unknown as { request?: Request })?.request ? extractRequestContext((context as unknown as { request: Request }).request) : { ip: null, userAgent: null };
              await logAudit({
                actorId: s.userId,
                action: "AUTH_LOGOUT",
                targetType: "Auth",
                targetId: s.id ?? "session",
                metadata: { sessionId: s.id },
                ip: reqCtx.ip,
                userAgent: reqCtx.userAgent,
              });
            }
          } catch {}
        },
      },
    },
    account: {
      create: {
        after: async (account, context) => {
          try {
            const { logAudit, extractRequestContext } = await import("@/lib/services/auditService");
            const acc = account as unknown as { userId: string; providerId: string; id: string };
            const reqCtx = (context as unknown as { request?: Request })?.request ? extractRequestContext((context as unknown as { request: Request }).request) : { ip: null, userAgent: null };
            await logAudit({
              actorId: acc.userId,
              action: "AUTH_LOGIN_SUCCESS",
              targetType: "Auth",
              targetId: acc.id,
              metadata: { provider: acc.providerId, accountLink: true },
              ip: reqCtx.ip,
              userAgent: reqCtx.userAgent,
            });
          } catch {}
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
          hasPassword: !!(user as { passwordHash?: string | null }).passwordHash,
          onboardingComplete: extendedUser.onboardingComplete ?? false,
        },
        session,
      }
    }, options),
  ],
})
