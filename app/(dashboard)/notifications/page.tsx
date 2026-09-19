"use client";

import {
	Bell,
	BookOpen,
	Calendar,
	Heart,
	MessageCircle,
	Mic,
	Users,
	Zap,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

type NotificationType =
	| "NEW_MESSAGE"
	| "NEW_COMMENT"
	| "NEW_LIKE"
	| "NEW_FOLLOWER"
	| "GROUP_INVITE"
	| "PRAYER_UPDATE"
	| "SLOT_REMINDER"
	| "ADMIN_BROADCAST";

interface Notification {
	id: string;
	type: NotificationType;
	channel: string;
	title: string;
	body: string;
	link?: string;
	isRead: boolean;
	createdAt: string;
}

type TabFilter = "all" | "unread" | "archived";

const NOTIFICATION_TYPE_CONFIG: Record<
	NotificationType,
	{ icon: LucideIcon; labelKey: string }
> = {
	NEW_MESSAGE: { icon: MessageCircle, labelKey: "type.message" },
	NEW_COMMENT: { icon: MessageCircle, labelKey: "type.comment" },
	NEW_LIKE: { icon: Heart, labelKey: "type.like" },
	NEW_FOLLOWER: { icon: Users, labelKey: "type.follower" },
	GROUP_INVITE: { icon: Users, labelKey: "type.groupInvite" },
	PRAYER_UPDATE: { icon: BookOpen, labelKey: "type.prayerUpdate" },
	SLOT_REMINDER: { icon: Calendar, labelKey: "type.slotReminder" },
	ADMIN_BROADCAST: { icon: Zap, labelKey: "type.broadcast" },
};

function formatRelativeTime(dateStr: string, now: number, t: TFunction<"notifications">): string {
	const seconds = Math.floor((now - new Date(dateStr).getTime()) / 1000);
	if (seconds < 0) return t("time.justNow");
	if (seconds < 60) return t("time.justNow");
	if (seconds < 3600) {
		const m = Math.floor(seconds / 60);
		return t("time.minutesAgo", { count: m });
	}
	if (seconds < 86400) {
		const h = Math.floor(seconds / 3600);
		return t("time.hoursAgo", { count: h });
	}
	if (seconds < 604800) {
		const d = Math.floor(seconds / 86400);
		return t("time.daysAgo", { count: d });
	}
	return new Date(dateStr).toLocaleDateString();
}

function RelativeTime({ date }: { date: string }) {
	const { t } = useTranslation("notifications");
	const [relative] = useState(() => formatRelativeTime(date, Date.now(), t));
	return <span className="text-xs text-muted-foreground">{relative}</span>;
}

function NotificationItem({
	notification,
	onMarkRead,
}: {
	notification: Notification;
	onMarkRead: (id: string) => void;
}) {
	const { t } = useTranslation("notifications");
	const config = NOTIFICATION_TYPE_CONFIG[notification.type] ?? {
		icon: Bell,
		labelKey: "",
	};
	const Icon = config.icon;

	return (
		<button
			type="button"
			className={cn(
				"flex w-full items-start gap-3 px-2 sm:px-4 py-3 text-left transition-colors hover:bg-muted/50",
				!notification.isRead && "bg-muted/30",
			)}
			onClick={() => onMarkRead(notification.id)}
		>
			<div className="relative mt-0.5 shrink-0">
				<Icon
					className="size-4 text-muted-foreground"
					aria-hidden="true"
				/>
				{!notification.isRead && (
					<span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<span className="text-sm font-medium">{notification.title}</span>
				<p className="mt-0.5 truncate text-xs text-muted-foreground">
					{notification.body}
				</p>
			</div>
			<div className="flex shrink-0 flex-col items-end gap-1">
				<RelativeTime date={notification.createdAt} />
				{!notification.isRead && (
					<span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
						{t("time.new")}
					</span>
				)}
			</div>
		</button>
	);
}

function NotificationList({
	notifications,
	filter,
	onMarkRead,
}: {
	notifications: Notification[];
	filter: TabFilter;
	onMarkRead: (id: string) => void;
}) {
	const { t } = useTranslation("notifications");
	const filtered = useMemo(() => {
		if (filter === "unread") return notifications.filter((n) => !n.isRead);
		if (filter === "archived") return notifications.filter((n) => n.isRead);
		return notifications;
	}, [notifications, filter]);

	if (filtered.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-2 text-center sm:py-12">
				<Bell className="size-8 text-muted-foreground/50" aria-hidden="true" />
				<p className="mt-3 text-sm font-medium text-muted-foreground">
					{t("empty.title")}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{filter === "unread"
						? t("empty.unread")
						: filter === "archived"
							? t("empty.archived")
							: t("empty.all")}
				</p>
			</div>
		);
	}

	return (
		<div className="divide-y">
			{filtered.map((n) => (
				<NotificationItem
					key={n.id}
					notification={n}
					onMarkRead={onMarkRead}
				/>
			))}
		</div>
	);
}

const PREF_TYPES: { type: NotificationType; labelKey: string }[] = [
	{ type: "NEW_MESSAGE", labelKey: "prefs.newMessages" },
	{ type: "NEW_COMMENT", labelKey: "prefs.comments" },
	{ type: "NEW_LIKE", labelKey: "prefs.likes" },
	{ type: "NEW_FOLLOWER", labelKey: "prefs.followers" },
	{ type: "GROUP_INVITE", labelKey: "prefs.groupInvites" },
	{ type: "PRAYER_UPDATE", labelKey: "prefs.prayerUpdates" },
	{ type: "SLOT_REMINDER", labelKey: "prefs.slotReminders" },
	{ type: "ADMIN_BROADCAST", labelKey: "prefs.broadcasts" },
];

function NotificationPreferences() {
	const { t } = useTranslation("notifications");
	const [prefs, setPrefs] = useState<
		Record<string, Record<string, boolean>>
	>({
		email: {},
		push: {},
	});

	useEffect(() => {
		fetch("/api/v1/notifications/preferences")
			.then((r) => r.json())
			.then((d) => {
				if (d.success) setPrefs(d.data);
			})
			.catch(() => {});
	}, []);

	function toggle(channel: "email" | "push", type: string) {
		const updated = {
			...prefs,
			[channel]: { ...prefs[channel], [type]: !prefs[channel][type] },
		};
		setPrefs(updated);
		fetch("/api/v1/notifications/preferences", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updated),
		}).catch(() => {});
	}

	return (
		<div className="overflow-hidden rounded-lg border">
			<div className="flex items-center gap-2 border-b bg-card px-2 sm:px-4 py-3">
				<Mic className="size-4 text-muted-foreground" aria-hidden="true" />
				<span className="font-medium text-sm">{t("prefs.title")}</span>
			</div>
			<div className="divide-y bg-card">
				{PREF_TYPES.map(({ type, labelKey }) => (
					<div
						key={type}
						className="flex items-center justify-between px-2 sm:px-4 py-3"
					>
						<span className="text-sm">{t(labelKey)}</span>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<Switch
									size="sm"
									checked={prefs.email?.[type] !== false}
									onCheckedChange={() => toggle("email", type)}
									aria-label={t("prefs.emailAria", { label: t(labelKey) })}
								/>
								<span className="text-xs text-muted-foreground">{t("channel.email")}</span>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									size="sm"
									checked={prefs.push?.[type] !== false}
									onCheckedChange={() => toggle("push", type)}
									aria-label={t("prefs.pushAria", { label: t(labelKey) })}
								/>
								<span className="text-xs text-muted-foreground">{t("channel.push")}</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

const _now = Date.now();
const _dayMs = 86400000;

function ActivitySummary({ notifications }: { notifications: Notification[] }) {
	const { t } = useTranslation("notifications");
	const todayUnread = notifications.filter(
		(n) => !n.isRead && _now - new Date(n.createdAt).getTime() < _dayMs,
	).length;

	const weekUnread = notifications.filter(
		(n) =>
			!n.isRead && _now - new Date(n.createdAt).getTime() < _dayMs * 7,
	).length;

	const totalUnread = notifications.filter((n) => !n.isRead).length;

	const stats = [
		{
			label: t("stats.unreadToday"),
			value: todayUnread,
			description: t("stats.unreadTodayDesc"),
		},
		{
			label: t("stats.thisWeek"),
			value: weekUnread,
			description: t("stats.thisWeekDesc"),
		},
		{
			label: t("stats.totalUnread"),
			value: totalUnread,
			description: t("stats.totalUnreadDesc"),
		},
	];

	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
			{stats.map((stat) => (
				<Card key={stat.label}>
					<CardHeader className="pb-2">
						<CardTitle className="text-base font-medium">
							{stat.label}
						</CardTitle>
						<CardDescription className="text-xs">
							{stat.description}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<span className="text-3xl font-semibold">{stat.value}</span>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default function NotificationsPage() {
	const { t } = useTranslation("notifications");
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchNotifications = useCallback(async function fetchNotifications() {
		try {
			const res = await fetch("/api/v1/notifications");
			const data = await res.json();
			if (data.success) setNotifications(data.data);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	async function markRead(id: string) {
		await fetch(`/api/v1/notifications/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isRead: true }),
		});
		setNotifications(
			notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
		);
	}

	async function markAllRead() {
		await fetch("/api/v1/notifications", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "markAllRead" }),
		});
		setNotifications(
			notifications.map((n) => ({ ...n, isRead: true })),
		);
	}

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Bell className="size-6" />
				<h2 className="text-2xl">{t("title")}</h2>
			</div>

			{/* ─── Section 0: Original card (kept) ─── */}
			<Card>
				<CardContent className="pt-2 sm:pt-6">
					{loading ? (
						<p className="text-sm text-muted-foreground">{t("loading")}</p>
					) : notifications.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("empty.none")}
						</p>
					) : (
						<div className="flex flex-col gap-2">
							{notifications.map((n) => (
								<div
									key={n.id}
									className={`flex items-start gap-3 rounded-lg border p-2 sm:p-3 ${
										!n.isRead ? "bg-muted/50" : ""
									}`}
								>
									<div className="flex-1">
										<h6 className="text-sm font-medium">{n.title}</h6>
										<p className="text-xs text-muted-foreground">{n.body}</p>
										<p className="mt-1 text-xs text-muted-foreground">
											{new Date(n.createdAt).toLocaleDateString()}
										</p>
									</div>
									{!n.isRead && (
										<button
											type="button"
											onClick={() => markRead(n.id)}
											className="cursor-pointer text-xs text-primary hover:underline"
										>
											{t("action.markRead")}
										</button>
									)}
									{n.link && (
										<Link
											href={n.link}
											className="cursor-pointer text-xs text-primary hover:underline"
										>
											{t("action.view")}
										</Link>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* ─── Section 1: Inbox with tabs ─── */}
			<div className="overflow-hidden rounded-lg border bg-card">
				<div className="flex items-center justify-between border-b px-2 sm:px-4 py-3">
					<div className="flex items-center gap-2">
						<Bell
							className="size-4 text-muted-foreground"
							aria-hidden="true"
						/>
						<span className="font-medium text-sm">{t("inbox")}</span>
						{unreadCount > 0 && (
							<span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
								{unreadCount}
							</span>
						)}
					</div>
					{unreadCount > 0 && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={markAllRead}
							className="h-7 gap-1 px-2 text-xs"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="lucide lucide-check-check size-3"
								aria-hidden="true"
							>
								<path d="M18 6 7 17l-5-5" />
								<path d="m22 10-7.5 7.5L13 16" />
							</svg>
							{t("action.markAllRead")}
						</Button>
					)}
				</div>

				<Tabs defaultValue="all" className="w-full">
					<div className="border-b px-2 sm:px-4 py-2">
						<TabsList variant="line" className="h-8 w-full justify-start">
							<TabsTrigger value="all" className="text-xs">
							{t("tab.all")}
							</TabsTrigger>
							<TabsTrigger value="unread" className="text-xs">
							{t("tab.unread")}
								{unreadCount > 0 && (
									<Badge
										variant="secondary"
										className="ml-1.5 size-4 justify-center p-0 text-[10px]"
									>
										{unreadCount}
									</Badge>
								)}
							</TabsTrigger>
							<TabsTrigger value="archived" className="text-xs">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="lucide lucide-archive size-3"
									aria-hidden="true"
								>
									<rect width="20" height="5" x="2" y="3" rx="1" />
									<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
									<path d="M10 12h4" />
								</svg>
								{t("tab.archived")}
							</TabsTrigger>
						</TabsList>
					</div>

					{loading ? (
						<div className="space-y-3 p-2 sm:p-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="flex items-start gap-3">
									<Skeleton className="size-4 rounded-full" />
									<div className="flex-1 space-y-1.5">
										<Skeleton className="h-3 w-3/4" />
										<Skeleton className="h-2.5 w-1/2" />
									</div>
									<Skeleton className="h-3 w-10" />
								</div>
							))}
						</div>
					) : (
						<>
							<TabsContent value="all">
								<NotificationList
									notifications={notifications}
									filter="all"
									onMarkRead={markRead}
								/>
							</TabsContent>
							<TabsContent value="unread">
								<NotificationList
									notifications={notifications}
									filter="unread"
									onMarkRead={markRead}
								/>
							</TabsContent>
							<TabsContent value="archived">
								<NotificationList
									notifications={notifications}
									filter="archived"
									onMarkRead={markRead}
								/>
							</TabsContent>
						</>
					)}
				</Tabs>

				<div className="border-t px-2 sm:px-4 py-2.5">
					<p className="text-center text-xs text-muted-foreground">
					{t("summary.total", { count: notifications.length })} ·{" "}
					<span className="font-medium text-foreground">{t("summary.unread", { count: unreadCount })}</span>
					</p>
				</div>
			</div>

			{/* ─── Section 2: Notification Preferences ─── */}
			<NotificationPreferences />

			{/* ─── Section 3: Activity Summary ─── */}
			{!loading && notifications.length > 0 && (
				<ActivitySummary notifications={notifications} />
			)}
		</div>
	);
}