"use client"

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import type { OnboardingValues } from "@/lib/schemas/onboardingSchema"

interface OnboardingFlowClientProps {
  userName: string
  userId: string
}

export function OnboardingFlowClient({ userName, userId }: OnboardingFlowClientProps) {
  async function handleComplete(values: OnboardingValues): Promise<boolean> {
    try {
      const res = await fetch("/api/v1/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) return false
      const data = await res.json()
      return data.success === true
    } catch {
      return false
    }
  }

  return <OnboardingFlow onComplete={handleComplete} defaultName={userName} />
}