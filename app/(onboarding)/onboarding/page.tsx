"use client"

import { useRouter } from "next/navigation"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import type { OnboardingValues } from "@/lib/schemas/onboardingSchema"

export default function OnboardingSetupPage() {
  const router = useRouter()

  async function handleComplete(values: OnboardingValues) {
    const res = await fetch("/api/v1/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) return
    router.push("/overview")
  }

  return <OnboardingFlow onComplete={handleComplete} />
}