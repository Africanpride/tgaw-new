import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");
	if (!token)
		return NextResponse.json(
			{ success: false, error: "Token required" },
			{ status: 401 },
		);

	const user = await prisma.user.findFirst({
		where: { id: token },
	});
	if (!user)
		return NextResponse.json(
			{ success: false, error: "Invalid token" },
			{ status: 401 },
		);

	const bookings = await prisma.eventBooking.findMany({
		where: { userId: user.id, status: "CONFIRMED" },
		include: { event: true },
	});

	const calLines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//TGAW//EN",
		"CALSCALE:GREGORIAN",
	];

	for (const b of bookings) {
		const e = b.event;
		const dtStart = `${e.date.replace(/-/g, "")}T${e.time.replace(":", "")}00`;
		const endDate = new Date(`${e.date}T${e.time}:00`);
		endDate.setMinutes(endDate.getMinutes() + e.duration);
		const dtEnd = `${endDate.toISOString().replace(/[-:]/g, "").slice(0, 15)}`;

		calLines.push(
			"BEGIN:VEVENT",
			`DTSTART:${dtStart}`,
			`DTEND:${dtEnd}`,
			`SUMMARY:${e.title}`,
			e.passage ? `DESCRIPTION:${e.passage}` : "",
			e.zoomUrl ? `URL:${e.zoomUrl}` : "",
			"END:VEVENT",
		);
	}

	calLines.push("END:VCALENDAR");

	return new NextResponse(calLines.filter(Boolean).join("\r\n"), {
		headers: { "Content-Type": "text/calendar" },
	});
}
