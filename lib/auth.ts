import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { admin, twoFactor } from "better-auth/plugins"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.DATABASE_URL!)
const db = client.db()

export const auth = betterAuth({
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
})
