// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
	ArrowLeft,
	Users,
	Lock,
	Globe,
	Crown,
	Shield,
	UserPlus,
	Send,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { getSupabase } from "@/providers/RealtimeProvider";

interface Group {
	id: string;
	name: string;
	description?: string | null;
	coverImageUrl?: string | null;
	isPrivate: boolean;
	ownerId: string;
}

interface Member {
	id: string;
	userId: string;
	role: string;
}

interface Msg {
	id: string;
	senderId: string;
	body: string;
	createdAt: string;
}

export default function GroupDetailPage() {
	const { t } = useTranslation("groups");
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const [group, setGroup] = useState<Group | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [chat, setChat] = useState<Msg[]>([]);
	const [inviteEmail, setInviteEmail] = useState("");
	const [body, setBody] = useState("");
	const [convId, setConvId] = useState<string | null>(null);

	// Load group data
	useEffect(() => {
		async function load() {
			const gRes = await fetch("/api/v1/groups");
			const gData = await gRes.json();
			const found = (gData.data as Group[] | undefined)?.find((g) => g.id === id);
			if (found) setGroup(found);
			else setGroup(found ?? null);
			const mRes = await fetch(`/api/v1/groups/${id}/members`);
			const mData = await mRes.json();
			if (mData.success) setMembers(mData.data);
			const cRes = await fetch(`/api/v1/groups/${id}/conversation`).catch(() => null);
			if (cRes?.ok) {
				const cData = await cRes.json();
				if (cData.success) {
					setConvId(cData.data.id);
				}
			}
		}
		load();
	}, [id]);

	// Fetch initial chat history
	useEffect(() => {
		if (!convId) return;
		fetch(`/api/v1/messages?conversationId=${convId}&limit=50`)
			.then((r) => r.json())
			.then((data) => {
				if (data.success) setChat(data.data);
			})
			.catch(() => {});
	}, [convId]);

	// Subscribe to new messages via Supabase Realtime
	useEffect(() => {
		if (!convId) return;
		const supa = getSupabase();
		if (!supa) return;

		const channel = supa.channel(`group-chat-${convId}`);
		channel.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "messages",
				filter: `conversation_id=eq.${convId}`,
			},
			(payload) => {
				if (payload?.new) {
					setChat((prev) => [...prev, payload.new as Msg]);
				}
			}
		);
		channel.subscribe();
		return () => {
			channel.unsubscribe();
		};
	}, [convId]);

	// Invite user
	async function invite() {
		const email = inviteEmail.trim();
		if (!email) return;
		const search = await fetch(`/api/v1/users/search?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null);
		let userId = search?.data?.[0]?.id;
		if (!userId) {
			const alt = await fetch(`/api/v1/admin/users?search=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null);
			userId = alt?.data?.[0]?.id;
		}
		if (!userId) { toast.error(t("toast.userNotFound")); return; }
		const res = await fetch(`/api/v1/groups/${id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
		const data = await res.json();
		if (!data.success) { toast.error(data.error || t("toast.inviteFailed")); return; }
		setMembers((prev) => [...prev, data.data]); setInviteEmail(""); toast.success(t("toast.memberAdded"));
	}

	// Send message
	async function send() {
		if (!body.trim() || !convId) return;
		const payload = { conversationId: convId, body: body.trim() };
		const res = await fetch("/api/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
		const data = await res.json();
		if (!data.success) { toast.error(t("toast.sendFailed")); return; }
		setChat((prev) => [...prev, data.data]); setBody("");
	}

	if (!group) return <div className="flex justify-center py-16">Loading...</div>;

	return (
		<div className="flex flex-col gap-6">
			<Button variant="ghost" size="sm" className="w-fit cursor-pointer gap-1" onClick={() => router.push("/groups")}><ArrowLeft aria-hidden="true" className="size-4" />{t("detail.back")}</Button>

			<Card className="overflow-hidden">
				<div className="relative h-36 w-full bg-muted">
					{group.coverImageUrl ? <Image src={group.coverImageUrl} alt={group.name} fill className="object-cover" unoptimized /> : null}
					<Badge variant="secondary" className="absolute left-3 top-3 gap-1">
						{group.isPrivate ? <Lock aria-hidden="true" className="size-3" /> : null}
						{group.isPrivate ? <Globe aria-hidden="true" className="size-3" /> : null}
						{group.isPrivate ? t("card.private") : t("card.public")}
					</Badge>
				</div>
				<CardHeader>
					<CardTitle className="flex items-center gap-2"><Users aria-hidden="true" className="size-5" />{group.name}</CardTitle>
					{group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
				</CardHeader>
			</Card>

			<div className="grid gap-2 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Users aria-hidden="true" className="size-4" />{t("detail.membersTitle", { count: members.length })}</CardTitle></CardHeader>
					<CardContent className="space-y-3">
						<div className="flex gap-2">
							<Input placeholder={t("detail.invitePlaceholder")} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="h-8" />
							<Button size="sm" className="cursor-pointer gap-1" onClick={invite}><UserPlus aria-hidden="true" className="size-3.5" />{t("detail.inviteButton")}</Button>
						</div>
						<div className="space-y-2">
							{members.length > 0 ? (
								members.map((m) => (
									<div key={m.id} className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
										<Avatar className="size-6"><AvatarFallback className="text-[10px]">{m.userId.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
										<span className="truncate flex-1 text-xs">{m.userId.slice(0,8)}…</span>
										<Badge variant="outline" className="text-[10px] capitalize">
											{m.role === "owner" ? <Crown aria-hidden="true" className="size-3" /> : ""}
											{m.role === "moderator" ? <Shield aria-hidden="true" className="size-3" /> : ""}
											<span className="text-[10px]">{m.role}</span>
										</Badge>
									</div>
								))
							) : (
								<p className="text-xs text-muted-foreground">{t("detail.noMembers")}</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2 flex flex-col">
					<CardHeader><CardTitle className="text-sm">{t("detail.chatTitle")} {chat.length > 0 ? <span className="ml-2 text-xs font-normal text-emerald-600">● Live</span> : <span className="ml-2 text-xs font-normal text-muted-foreground">Offline</span>}</CardTitle></CardHeader>
					<CardContent className="flex flex-1 flex-col gap-3">
						<div className="flex-1 space-y-2 overflow-auto rounded-xl border bg-muted/20 p-2 sm:p-3 max-h-[360px] min-h-[240px]">
							{chat.length === 0 ? <p className="py-2 text-center text-sm text-muted-foreground sm:py-10">{t("detail.emptyChat")}</p> : chat.map((m) => (
								<div key={m.id} className="rounded-lg bg-card border px-2 sm:px-3 py-2 text-sm">
									<p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()} · {m.senderId.slice(0,6)}</p>
									<p className="mt-1">{m.body}</p>
								</div>
							))}
						</div>
						<div className="flex gap-2">
							<Input placeholder={t("detail.composerActive")} value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={!convId} className="h-9" />
							<Button onClick={send} disabled={!body.trim() || !convId} className="cursor-pointer gap-1"><Send aria-hidden="true" className="size-4" />{t("detail.send")}</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}