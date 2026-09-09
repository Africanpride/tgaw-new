import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { OnboardingFlowClient } from "./OnboardingFlowClient"

export default async function OnboardingSetupPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  // Check if onboarding is complete by looking for a UserProfile
  const { prisma } = await import("@/lib/db/prisma")
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id! },
  })
  if (profile) {
    redirect("/overview")
  }

  return <OnboardingFlowClient userName={session.user.name ?? ""} userId={session.user.id!} />
}