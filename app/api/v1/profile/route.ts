import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { onboardingSchema } from "@/lib/schemas/onboardingSchema"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  const body = await req.json()
  const validation = onboardingSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )
  }

  const { firstName, lastName, phone, country, sex, ageRange, timezone } =
    validation.data

  const userId = session.user.id!

  // Create the onboarding profile
  await prisma.userProfile.create({
    data: { userId, phone, country, sex, ageRange, timezone },
  })

  // Also update name in our User table if the record exists
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: `${firstName} ${lastName}` },
    })
  } catch {
    // OAuth user — Prisma User record may not exist, that's fine
  }

  return NextResponse.json({ success: true })
}
