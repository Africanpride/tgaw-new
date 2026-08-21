import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { updateEventSchema } from "@/lib/schemas/eventSchema";
import {
  applyEventBlock,
  blockableSlotTypes,
  eventEndTime,
  restoreEventBlock,
  type BlockableType,
} from "@/lib/services/eventBlockService";

const EVENT_MANAGER_ROLES = new Set(["superadmin", "coordinator"]);

function canManageEvents(role?: string | null): boolean {
  return role ? EVENT_MANAGER_ROLES.has(role) : false;
}

function blockTypesFor(values: { type: string; blockTypes?: BlockableType[] }): Set<BlockableType> {
  if (values.type === "SPECIAL") {
    return new Set(values.blockTypes ?? []);
  }
  return blockableSlotTypes(values.type);
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

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	const { id } = await params;
	const event = await prisma.event.findUnique({ where: { id } });
	if (!event)
		return NextResponse.json(
			{ success: false, error: "Not found" },
			{ status: 404 },
		);

	return NextResponse.json({ success: true, data: event });
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);
	if (!canManageEvents(session.user.role as string)) {
		return NextResponse.json(
			{ success: false, error: "Only coordinators and admins can edit events" },
			{ status: 403 },
		);
	}

	const { id } = await params;
	const body = await req.json();
	const validation = updateEventSchema.safeParse(body);
	if (!validation.success)
		return NextResponse.json(
			{ success: false, error: validation.error.format() },
			{ status: 400 },
		);

	const existing = await prisma.event.findUnique({ where: { id } });
	if (!existing)
		return NextResponse.json(
			{ success: false, error: "Not found" },
			{ status: 404 },
		);

	// Consider re-blocking only if the blocking-relevant bits changed.
	const windowChanged =
		validation.data.date != null ||
		validation.data.time != null ||
		validation.data.duration != null ||
		validation.data.type != null ||
		validation.data.blockTypes != null;

	const event = await prisma.event.update({
		where: { id },
		data: validation.data,
	});

	if (windowChanged) {
		// Swap the block: unblock old slots, block new ones.
		await restoreEventBlock(id);
		const merged = {
			type: event.type,
			date: event.date,
			time: event.time,
			duration: event.duration,
			blockTypes: (event.blockTypes ?? undefined) as BlockableType[] | undefined,
		};
		const allowed = blockTypesFor(merged);
		const blocked = await applyEventBlock(id, toWindow(merged), allowed);
		return NextResponse.json({ success: true, data: event, blocked });
	}

	return NextResponse.json({ success: true, data: event });
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);
	if (!canManageEvents(session.user.role as string)) {
		return NextResponse.json(
			{ success: false, error: "Only coordinators and admins can delete events" },
			{ status: 403 },
		);
	}

	const { id } = await params;
	// Unblock any slots this event blocked, restoring displaced bookers.
	await restoreEventBlock(id);
	await prisma.event.delete({ where: { id } });
	return NextResponse.json({ success: true, data: null });
}