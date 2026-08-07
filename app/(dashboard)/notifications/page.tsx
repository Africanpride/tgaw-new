"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Notification {
	id: string;
	type: string;
	channel: string;
	title: string;
	body: string;
	link?: string;
	isRead: boolean;
	createdAt: string;
}

export default function NotificationsPage() {
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

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<Bell className="size-6" />
				<h2 className="text-2xl font-bold">Notifications</h2>
			</div>

			<Card>
				<CardContent className="pt-6">
					{loading ? (
						<p className="text-sm text-muted-foreground">Loading...</p>
					) : notifications.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No notifications yet.
						</p>
					) : (
						<div className="flex flex-col gap-2">
							{notifications.map((n) => (
								<div
									key={n.id}
									className={`flex items-start gap-3 rounded-lg border p-3 ${
										!n.isRead ? "bg-muted/50" : ""
									}`}
								>
									<div className="flex-1">
										<p className="text-sm font-medium">{n.title}</p>
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
											Mark read
										</button>
									)}
									{n.link && (
										<Link
											href={n.link}
											className="cursor-pointer text-xs text-primary hover:underline"
										>
											View
										</Link>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
