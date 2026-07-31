"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { createEventSchema } from "@/lib/schemas/eventSchema"
import { headers } from "next/headers"

export async function createEvent(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorised")

  const data = {
    type: formData.get("type") as string,
    title: formData.get("title") as string,
    passage: (formData.get("passage") as string) || undefined,
    date: formData.get("date") as string,
    time: formData.get("time") as string,
    duration: Number(formData.get("duration")),
    zoomUrl: (formData.get("zoomUrl") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  }

  const validation = createEventSchema.safeParse(data)
  if (!validation.success) throw new Error("Validation failed")

  const event = await prisma.event.create({
    data: { ...validation.data, userId: session.user.id! },
  })

  return event
}
