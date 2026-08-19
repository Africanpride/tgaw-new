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

  const { name, phone, country, sex, ageRange, timezone } = validation.data

  const userId = session.user.id!

  // Upsert the onboarding profile
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, phone, country, sex, ageRange, timezone },
    update: { phone, country, sex, ageRange, timezone },
  })

  // Update the user's name through Better Auth (works for email & OAuth users)
  await auth.api.updateUser({
    body: { name },
    headers: await headers(),
  })

  return NextResponse.json({ success: true })
}
