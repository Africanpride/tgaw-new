import { betterAuth, type BetterAuthOptions } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { admin, twoFactor, customSession } from "better-auth/plugins"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.DATABASE_URL!)
const db = client.db()

const options = {
  appName: "TGAW",
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
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
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      return {
        user: {
          ...user,
          image: user.image ?? null,
        },
        session,
      }
    }, options),
  ],
})
