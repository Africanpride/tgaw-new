import { format } from "date-fns";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { EventType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { IcalCopyButton } from "@/components/calendar/ical-copy-button";
import {
	CalendarView,
	type CalendarItem,
	type CalendarItemColor,
} from "@/components/calendar/calendar-view";
import {
	isCalendarViewMode,
	type CalendarViewMode,
} from "@/components/calendar/calendar-helpers";
import {
	convertTimeToTimezone,
	utcSlotToLocalDate,
} from "@/lib/calendar-utils";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from "@/i18n/config";
import { getServerTranslation } from "@/lib/notifications/locale";

const SLOT_COLOR_MAP: Record<EventType, CalendarItemColor> = {
	BIBLE: "purple",
	PRAYER: "red",
	PRAISE_WORSHIP: "amber",
	SPECIAL: "violet",
};

export default async function CalendarPage(props: {
	searchParams: Promise<{ month?: string; view?: string; date?: string }>;
}) {
	const searchParams = await props.searchParams;
	const monthParam = searchParams?.month;
	const viewParam = searchParams?.view;
	const dateParam = searchParams?.date;

	// Mirrors the client-side derivation in CalendarView: ?date > ?month > today.
	const initialView: CalendarViewMode = isCalendarViewMode(viewParam)
		? viewParam
		: "month";
	const initialDate = (() => {
		if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return dateParam;
		if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
			const [y, m] = monthParam.split("-").map(Number);
			return format(new Date(y, m - 1, 1), "yyyy-MM-dd");
		}
		return undefined;
	})();

	const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
	const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
	const t = (key: string) => getServerTranslation(locale, "calendar", key);

	const [pageTitle, pageSubtitle, bibleLabel, prayerLabel, worshipLabel, specialLabel] = await Promise.all([
		t("header.title"),
		t("header.subtitle"),
		t("type.BIBLE"),
		t("type.PRAYER"),
		t("type.PRAISE_WORSHIP"),
		t("type.SPECIAL"),
	]);

	const typeLabelMap: Record<EventType, string> = {
		BIBLE: bibleLabel,
		PRAYER: prayerLabel,
		PRAISE_WORSHIP: worshipLabel,
		SPECIAL: specialLabel,
	};

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) redirect("/login");

	// Fetch the full anchor year so year/month/week/day views are all derived client-side.
	const anchorYear = (initialDate
		? Number(initialDate.slice(0, 4))
		: new Date().getFullYear());
	const startDate = `${anchorYear}-01-01`;
	const endDate = `${anchorYear}-12-31`;

	// Fetch the user's timezone so slot/event times render in their locale.
	const profile = await prisma.userProfile.findUnique({
		where: { userId: session.user.id },
		select: { timezone: true },
	});
	const userTimezone = profile?.timezone ?? "UTC";

	// Fetch the user's booked slots and visible events (user's own events + organization-wide Special Events).
	const [slots, events] = await Promise.all([
		prisma.slot.findMany({
			where: {
				bookedBy: session.user.id,
				date: { gte: startDate, lte: endDate },
			},
			orderBy: [{ date: "asc" }, { startTime: "asc" }],
		}),
		prisma.event.findMany({
			where: {
				date: { gte: startDate, lte: endDate },
				OR: [
					{ userId: session.user.id },
					{ type: "SPECIAL" },
				],
			},
			orderBy: [{ date: "asc" }, { time: "asc" }],
		}),
	]);

	// Meeting links: DEFAULT fallbacks plus any link set within the anchor year.
	const meetingLinks = await prisma.meetingLink.findMany({
		where: {
			OR: [
				{ date: "DEFAULT" },
				{ date: { gte: startDate, lte: endDate } },
			],
		},
	});
	// Exact date matches take priority; DEFAULT is the fallback.
	const meetingLinkMap = new Map<string, (typeof meetingLinks)[number]>();
	for (const ml of meetingLinks) {
		if (ml.date === "DEFAULT") {
			const key = `${ml.type}|DEFAULT`;
			if (!meetingLinkMap.has(key)) meetingLinkMap.set(key, ml);
		} else {
			meetingLinkMap.set(`${ml.type}|${ml.date}`, ml);
		}
	}

	// Transform slots into CalendarItems (times converted to the user's timezone).
	const slotItems: CalendarItem[] = slots.map((slot) => {
		const link =
			meetingLinkMap.get(`${slot.type}|${slot.date}`) ??
			meetingLinkMap.get(`${slot.type}|DEFAULT`);
		return {
			id: `slot-${slot.id}`,
			source: "slot",
			type: slot.type,
			title: `${typeLabelMap[slot.type] ?? slot.type} ${convertTimeToTimezone(slot.startTime, slot.date, userTimezone)}–${convertTimeToTimezone(slot.endTime, slot.date, userTimezone)}`,
			color: SLOT_COLOR_MAP[slot.type],
			date: utcSlotToLocalDate(slot.date, slot.startTime).toISOString(),
			startTime: convertTimeToTimezone(slot.startTime, slot.date, userTimezone),
			endTime: convertTimeToTimezone(slot.endTime, slot.date, userTimezone),
			notes: slot.notes,
			zoomUrl: link?.url ?? null,
			zoomLabel: link?.label ?? null,
		};
	});

	// Transform events into CalendarItems (times converted to the user's timezone).
	const eventItems: CalendarItem[] = events.map((event) => ({
		id: `event-${event.id}`,
		source: "event",
		type: event.type,
		title: event.title,
		color: event.type === "SPECIAL" ? "violet" : "blue",
		date: utcSlotToLocalDate(event.date, event.time).toISOString(),
		startTime: convertTimeToTimezone(event.time, event.date, userTimezone),
		duration: event.duration,
		notes: event.notes,
		passage: event.passage,
		zoomUrl: event.zoomUrl,
		rawEventId: event.id,
		rawDate: event.date,
		rawTime: event.time,
		blockTypes: event.blockTypes ?? [],
	}));

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<div>
					<h1 className="text-2xl">{pageTitle}</h1>
					<p className="text-muted-foreground">
						{pageSubtitle}
					</p>
				</div>
				<IcalCopyButton token={session.user.id} />
			</div>

			<CalendarView
				items={[...slotItems, ...eventItems]}
				userTimezone={userTimezone}
				initialView={initialView}
				initialDate={initialDate}
				canCreate={
					session.user.role === "superadmin" ||
					session.user.role === "coordinator"
				}
				canManage={
					session.user.role === "superadmin" ||
					session.user.role === "coordinator"
				}
			/>
		</div>
	);
}