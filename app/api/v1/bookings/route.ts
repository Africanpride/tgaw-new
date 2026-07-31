import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createBookingSchema = z.object({
  eventId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const body = await req.json()
  const validation = createBookingSchema.safeParse(body)
  if (!validation.success)
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )

  const event = await prisma.event.findUnique({
    where: { id: validation.data.eventId },
    include: { bookings: { where: { status: "CONFIRMED" } } },
  })
  if (!event)
    return NextResponse.json(
      { success: false, error: "Event not found" },
      { status: 404 }
    )

  if (event.capacity && event.bookings.length >= event.capacity) {
    return NextResponse.json(
      { success: false, error: "Event is full" },
      { status: 409 }
    )
  }

  const existing = await prisma.eventBooking.findUnique({
    where: { eventId_userId: { eventId: validation.data.eventId, userId: session.user.id! } },
  })
  if (existing && existing.status === "CONFIRMED") {
    return NextResponse.json(
      { success: false, error: "Already booked" },
      { status: 409 }
    )
  }

  const booking = await prisma.eventBooking.upsert({
    where: { eventId_userId: { eventId: validation.data.eventId, userId: session.user.id! } },
    update: { status: "CONFIRMED" },
    create: { eventId: validation.data.eventId, userId: session.user.id! },
  })

  return NextResponse.json({ success: true, data: booking }, { status: 201 })
}
