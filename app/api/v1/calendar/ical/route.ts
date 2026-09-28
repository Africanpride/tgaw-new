import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { buildIcs, getFeedWindow } from "@/lib/calendar/ics";
import { buildFeedItems, type FeedLabels } from "@/lib/calendar/feedItems";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getServerTranslation } from "@/lib/notifications/locale";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");
	if (!token) {
		return NextResponse.json(
			{ success: false, error: "Token required" },
			{ status: 401 },
		);
	}

	const user = await prisma.user.findFirst({
		where: { calendarFeedToken: token },
		select: { id: true, preferredLocale: true },
	});
	if (!user) {
		return NextResponse.json(
			{ success: false, error: "Invalid token" },
			{ status: 401 },
		);
	}

	const { startDate, endDate } = getFeedWindow(new Date());

	const [slots, events, meetingLinks] = await Promise.all([
		prisma.slot.findMany({
			where: {
				bookedBy: user.id,
				date: { gte: startDate, lte: endDate },
			},
			orderBy: [{ date: "asc" }, { startTime: "asc" }],
		}),
		prisma.event.findMany({
			where: {
				date: { gte: startDate, lte: endDate },
				OR: [{ userId: user.id }, { type: "SPECIAL" }],
			},
			orderBy: [{ date: "asc" }, { time: "asc" }],
		}),
		prisma.meetingLink.findMany({
			where: {
				OR: [{ date: "DEFAULT" }, { date: { gte: startDate, lte: endDate } }],
			},
		}),
	]);

	const locale = isLocale(user.preferredLocale)
		? user.preferredLocale
		: DEFAULT_LOCALE;
	const t = (key: string) => getServerTranslation(locale, "calendar", key);
	const labels: FeedLabels = {
		BIBLE: await t("type.BIBLE"),
		PRAYER: await t("type.PRAYER"),
		PRAISE_WORSHIP: await t("type.PRAISE_WORSHIP"),
		SPECIAL: await t("type.SPECIAL"),
	};

	const ics = buildIcs(
		buildFeedItems({ slots, events, meetingLinks, labels }),
		new Date(),
	);

	return new NextResponse(ics, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Cache-Control": "private, max-age=1800",
			"Content-Disposition": 'inline; filename="tgaw-calendar.ics"',
		},
	});
}
