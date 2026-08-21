import type { LucideIcon } from "lucide-react";
import { format, isToday, parse } from "date-fns";
import { VideoOff } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { FadeIn } from "@/components/dashboard/FadeIn";
import { DateNav } from "@/components/date-nav";
import { SlotBookingStrip } from "@/components/booking/SlotBookingStrip";
import { DisplacedBookingNotice } from "@/components/booking/DisplacedBookingNotice";
import { MyDevotionBookings } from "@/components/booking/MyDevotionBookings";
import { MeetingLinkCard } from "@/components/booking/MeetingLinkCard";
import {
	getActiveSlotHosts,
	getSlotsForDate,
	getUserSlotStats,
	type BookableType,
} from "@/lib/services/slotService";
import { formatMinutes } from "@/lib/services/slotStats";
import { slotAccent } from "@/components/booking/slotAccent";

function getCurrentSlotId(
	slots: { id: string; startTime: string; endTime: string }[],
): string | undefined {
	const nowHHMM = format(new Date(), "HH:mm");
	return slots.find((s) => s.startTime <= nowHHMM && s.endTime > nowHHMM)?.id;
}

export interface DevotionPageProps {
	/** YYYY-MM-DD */
	dateStr: string;
	type: BookableType;
	basePath: string;
	title: string;
	description: string;
	icon: LucideIcon;
	/** Human noun for bookings copy, e.g. "prayer". */
	slotNoun: string;
	roomLabel: string;
}

export async function DevotionPage({
	dateStr,
	type,
	basePath,
	title,
	description,
	icon: Icon,
	slotNoun,
	roomLabel,
}: DevotionPageProps) {
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session?.user?.id;

	const viewingToday = isToday(parse(dateStr, "yyyy-MM-dd", new Date()));

	const [bookingData, stats] = await Promise.all([
		getSlotsForDate(dateStr, type, userId, session?.user?.role as string),
		userId
			? getUserSlotStats(userId)
			: Promise.resolve({ weekSessions: 0, monthSessions: 0, monthMinutes: 0 }),
	]);
	const { slots, meetingLinks, displacedBookings } = bookingData;

	const meetingLink = meetingLinks[type];
	const myBookings = slots.filter((s) => s.isOwnBooking);
	const initialSlotId = viewingToday ? getCurrentSlotId(slots) : undefined;
	const accent = slotAccent[type];

	let liveHostName: string | null = null;
	if (viewingToday && meetingLink) {
		const hosts = await getActiveSlotHosts();
		liveHostName = hosts[type];
	}

	return (
		<div className="flex flex-col gap-6">
			<FadeIn>
				<div className="flex items-start gap-4">
					<span
						className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border ${accent.iconTile}`}
					>
						<Icon className="size-6" aria-hidden="true" />
					</span>
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
						<p className="text-sm text-muted-foreground">{description}</p>
					</div>
				</div>
			</FadeIn>

			<FadeIn delay={0.06}>
				<div className="grid gap-4 sm:grid-cols-3">
					<StatCard
						title="Sessions This Week"
						value={stats.weekSessions}
						icon={Icon}
						className={accent.rail}
					/>
					<StatCard
						title="Sessions This Month"
						value={stats.monthSessions}
						icon={Icon}
						className={accent.rail}
					/>
					<StatCard
						title="Time This Month"
						value={formatMinutes(stats.monthMinutes)}
						icon={Icon}
						className={accent.rail}
					/>
				</div>
			</FadeIn>

			<FadeIn delay={0.12}>
				<Card className="min-w-0 w-full overflow-hidden shadow-md">
					<CardContent className="flex items-center justify-between p-6 pb-0 max-sm:flex-col max-sm:gap-3 sm:p-6 sm:pb-0">
						<DateNav dateStr={dateStr} basePath={basePath} />
					</CardContent>
					<CardContent className="pt-4">
						<SlotBookingStrip slots={slots} type={type} initialSlotId={initialSlotId} />
					</CardContent>
				</Card>
			</FadeIn>

			<div className="grid gap-6 lg:grid-cols-2">
				<FadeIn delay={0.18}>
					<Card className="h-full min-w-0">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Icon className={`size-5 ${accent.iconText}`} aria-hidden="true" />
								Your Slots for{" "}
								{format(parse(dateStr, "yyyy-MM-dd", new Date()), "MMM d")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<DisplacedBookingNotice bookings={displacedBookings ?? []} slotNoun={slotNoun} />
							<MyDevotionBookings
								bookings={myBookings}
								type={type}
								meetingUrl={meetingLink?.url ?? null}
								slotNoun={slotNoun}
							/>
						</CardContent>
					</Card>
				</FadeIn>

				<FadeIn delay={0.24}>
					<Card className="h-full min-w-0">
						<CardHeader>
							<CardTitle>Meeting Room</CardTitle>
						</CardHeader>
						<CardContent>
							{meetingLink ? (
								<MeetingLinkCard
									url={meetingLink.url}
									label={meetingLink.label || roomLabel}
									hostName={liveHostName}
								/>
							) : (
								<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
									<span className="flex size-10 items-center justify-center rounded-full bg-muted">
										<VideoOff className="size-5 text-muted-foreground" aria-hidden="true" />
									</span>
									<p className="text-sm font-medium">No meeting link yet</p>
									<p className="max-w-[30ch] text-sm text-muted-foreground">
										A Zoom/Teams link for {format(parse(dateStr, "yyyy-MM-dd", new Date()), "MMMM d")} will appear here once posted.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</FadeIn>
			</div>
		</div>
	);
}
