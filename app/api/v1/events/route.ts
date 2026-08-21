import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createEventSchema } from "@/lib/schemas/eventSchema";
import {
  applyEventBlock,
  blockableSlotTypes,
  eventEndTime,
  previewEventBlock,
  type BlockableType,
} from "@/lib/services/eventBlockService";

const EVENT_MANAGER_ROLES = new Set(["superadmin", "coordinator"]);

function canManageEvents(role?: string | null): boolean {
  return role ? EVENT_MANAGER_ROLES.has(role) : false;
}

function toWindow(values: {
  date: string;
  time: string;
  duration: number;
}): { date: string; start: string; end: string } {
  return {
    date: values.date,
    start: values.time,
    end: eventEndTime(values.time, values.duration),
  };
}

function blockTypesFor(values: { type: string; blockTypes?: BlockableType[] }): Set<BlockableType> {
  if (values.type === "SPECIAL") {
    return new Set(values.blockTypes ?? []);
  }
  return blockableSlotTypes(values.type);
}

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { searchParams } = new URL(req.url);
	const date = searchParams.get("date");
	const type = searchParams.get("type");

	const { limit = "20", cursor } = Object.fromEntries(searchParams);
	const take = Math.min(Number(limit), 100);
	const events = await prisma.event.findMany({
		where: {
			userId: session.user.id!,
			...(date ? { date } : {}),
			...(type ? { type: type as "BIBLE" | "PRAYER" | "PRAISE_WORSHIP" | "SPECIAL" } : {}),
		},
		orderBy: { time: "asc" },
		take: take + 1,
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
	});
	const hasMore = events.length > take;
	const data = hasMore ? events.slice(0, take) : events;
	return NextResponse.json({
		success: true,
		data,
		nextCursor: hasMore ? data[data.length - 1]?.id : null,
	});
}

/**
 * Preview — returns the slots an event would block and how many users it would
 * displace, without mutating anything. Lets the coordinator see the warning.
 */
export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	if (!canManageEvents(session.user.role as string)) {
		return NextResponse.json(
			{ success: false, error: "Only coordinators and admins can create events" },
			{ status: 403 },
		);
	}

	const body = await req.json();

	// Preview mode: report displacement without persisting.
	if (body._preview === true) {
		const previewBody = { ...body };
		delete previewBody._preview;
		const v = createEventSchema.safeParse(previewBody);
		if (!v.success)
			return NextResponse.json(
				{ success: false, error: v.error.format() },
				{ status: 400 },
			);
		const allowed = blockTypesFor(v.data);
		const { operations, displacingCount } = await previewEventBlock(
			toWindow(v.data),
			allowed,
		);
		return NextResponse.json({
			success: true,
			data: {
				blockedSlotCount: operations.length,
				displacingCount,
				willDisplace: displacingCount > 0,
			},
		});
	}

	const validation = createEventSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	// Hard block: if there ARE slots to displace, the coordinator must confirm.
	const allowed = blockTypesFor(validation.data);
	const { displacingCount } = await previewEventBlock(toWindow(validation.data), allowed);
	if (displacingCount > 0 && body._confirm !== true) {
		return NextResponse.json(
			{
				success: false,
				error: "This event will override booked slots",
				code: "NEEDS_CONFIRM",
				data: { displacingCount },
			},
			{ status: 409 },
		);
	}

	const event = await prisma.event.create({
		data: { ...validation.data, userId: session.user.id! },
	});

	const blocked = await applyEventBlock(event.id, toWindow(validation.data), allowed);

	return NextResponse.json(
		{ success: true, data: event, blocked },
		{ status: 201 },
	);
}