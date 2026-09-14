"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Users, Lock, Globe, Crown, Shield, UserPlus, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSocket } from "@/providers/SocketProvider"

interface Group {
  id: string
  name: string
  description?: string | null
  coverImageUrl?: string | null
  isPrivate: boolean
  ownerId: string
}

interface Member {
  id: string
  userId: string
  role: string
}

interface Msg { id: string; senderId: string; body: string; createdAt: string }

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [chat, setChat] = useState<Msg[]>([])
  const [body, setBody] = useState("")
  const { socket, connected } = useSocket()
  const [convId, setConvId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const gRes = await fetch(`/api/v1/groups`)
      const gData = await gRes.json()
      const found = (gData.data as Group[] | undefined)?.find((g) => g.id === id)
      if (found) setGroup(found)
      else {
        // fallback fetch single if available
        setGroup(found ?? null)
      }
      const mRes = await fetch(`/api/v1/groups/${id}/members`)
      const mData = await mRes.json()
      if (mData.success) setMembers(mData.data)
      // create/fetch conversation for group
      const cRes = await fetch(`/api/v1/groups/${id}/conversation`).catch(() => null)
      if (cRes?.ok) {
        const cData = await cRes.json()
        if (cData.success) {
          setConvId(cData.data.id)
          socket?.emit("conversation:join", cData.data.id)
          const hist = await fetch(`/api/v1/messages?conversationId=${cData.data.id}`).then((r) => r.json()).catch(() => null)
          if (hist?.success) setChat(hist.data)
        }
      }
    }
    load()
    return () => { if (convId) socket?.emit("conversation:leave", convId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!socket || !convId) return
    const onNew = (p: Msg & { conversationId: string }) => {
      if (p.conversationId === convId) setChat((prev) => [...prev, p])
    }
    socket.on("message:new", onNew)
    return () => { socket.off("message:new", onNew) }
  }, [socket, convId])

  async function invite() {
    const email = inviteEmail.trim()
    if (!email) return
    // search user by email
    const search = await fetch(`/api/v1/users/search?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null)
    let userId = search?.data?.[0]?.id
    if (!userId) {
      // fallback: try admin users search
      const alt = await fetch(`/api/v1/admin/users?search=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null)
      userId = alt?.data?.[0]?.id
    }
    if (!userId) { toast.error("User not found by email"); return }
    const res = await fetch(`/api/v1/groups/${id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) })
    const data = await res.json()
    if (!data.success) { toast.error(data.error || "Invite failed"); return }
    setMembers((prev) => [...prev, data.data]); setInviteEmail(""); toast.success("Member added")
  }

  async function send() {
    if (!body.trim() || !convId) return
    const payload = { conversationId: convId, body: body.trim() }
    // persist via REST then broadcast
    const res = await fetch(`/api/v1/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!data.success) { toast.error("Send failed"); return }
    socket?.emit("message:send", { conversationId: convId, ...data.data })
    setChat((prev) => [...prev, data.data]); setBody("")
  }

  if (!group) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit cursor-pointer gap-1" onClick={() => router.push("/groups")}><ArrowLeft className="size-4" />Back</Button>

      <Card className="overflow-hidden">
        <div className="relative h-36 w-full bg-muted">
          {group.coverImageUrl ? <Image src={group.coverImageUrl} alt={group.name} fill className="object-cover" unoptimized /> : null}
          <Badge variant="secondary" className="absolute left-3 top-3 gap-1">{group.isPrivate ? <Lock className="size-3" /> : <Globe className="size-3" />}{group.isPrivate ? "Private" : "Public"}</Badge>
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-5" />{group.name}</CardTitle>
          {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
        </CardHeader>
      </Card>

      <div className="grid gap-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Users className="size-4" />Members ({members.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Invite by email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="h-8" />
              <Button size="sm" className="cursor-pointer gap-1" onClick={invite}><UserPlus className="size-3.5" />Invite</Button>
            </div>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
                  <Avatar className="size-6"><AvatarFallback className="text-[10px]">{m.userId.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                  <span className="truncate flex-1 text-xs">{m.userId.slice(0,8)}…</span>
                  <Badge variant="outline" className="text-[10px] capitalize gap-1">{m.role === "owner" ? <Crown className="size-3" /> : m.role === "moderator" ? <Shield className="size-3" /> : null}{m.role}</Badge>
                </div>
              ))}
              {members.length === 0 && <p className="text-xs text-muted-foreground">No members yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader><CardTitle className="text-sm">Group Chat {connected ? <span className="ml-2 text-xs font-normal text-emerald-600">● live</span> : <span className="ml-2 text-xs font-normal text-muted-foreground">offline</span>}</CardTitle></CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex-1 space-y-2 overflow-auto rounded-xl border bg-muted/20 p-3 max-h-[360px] min-h-[240px]">
              {chat.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No messages yet — say hello.</p> : chat.map((m) => (
                <div key={m.id} className="rounded-lg bg-card border px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()} · {m.senderId.slice(0,6)}</p>
                  <p className="mt-1">{m.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder={convId ? "Type a message…" : "Joining conversation…"} value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={!convId} className="h-9" />
              <Button onClick={send} disabled={!body.trim() || !convId} className="cursor-pointer gap-1"><Send className="size-4" />Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}