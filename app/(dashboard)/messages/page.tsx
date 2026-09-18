"use client"

import { MessageSquare, MessageSquarePlus, Send, Search, Users, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/providers/SocketProvider"
import { EmptyState } from "@/components/EmptyState"
import { useSession } from "@/lib/auth-client"

interface Conv {
  id: string
  type: "DIRECT" | "GROUP"
  groupId?: string | null
  memberIds: string[]
  messages?: { id: string; body: string; senderId: string; createdAt: string }[]
  updatedAt: string
}

interface Msg { id: string; senderId: string; body: string; conversationId: string; createdAt: string }

export default function MessagesPage() {
  const { data: session } = useSession()
  const myId = session?.user?.id
  const { socket, connected } = useSocket()
  const [convs, setConvs] = useState<Conv[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [body, setBody] = useState("")
  const [startEmail, setStartEmail] = useState("")
  const [starting, setStarting] = useState(false)

  async function loadConvs() {
    const res = await fetch("/api/v1/conversations")
    const data = await res.json()
    if (data.success) setConvs(data.data)
    setLoading(false)
  }
  useEffect(() => { loadConvs() }, [])

  async function loadMsgs(id: string) {
    const res = await fetch(`/api/v1/messages?conversationId=${id}&limit=50`)
    const data = await res.json()
    if (data.success) setMsgs([...data.data].reverse())
  }

  useEffect(() => {
    if (!activeId) return
    loadMsgs(activeId)
    socket?.emit("conversation:join", activeId)
    return () => { socket?.emit("conversation:leave", activeId) }
  }, [activeId, socket])

  useEffect(() => {
    if (!socket || !activeId) return
    const onNew = (p: Msg) => {
      if (p.conversationId === activeId) setMsgs((prev) => [...prev, p])
      else {
        // bump conv to top
        setConvs((prev) => {
          const idx = prev.findIndex((c) => c.id === p.conversationId)
          if (idx === -1) return prev
          const copy = [...prev]; const [hit] = copy.splice(idx,1); copy.unshift(hit); return copy
        })
      }
    }
    socket.on("message:new", onNew)
    return () => { socket.off("message:new", onNew) }
  }, [socket, activeId])

  async function startConversation() {
    const email = startEmail.trim()
    if (!email) return
    setStarting(true)
    try {
      const search = await fetch(`/api/v1/users/search?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null)
      let userId = search?.data?.[0]?.id
      if (!userId) {
        const alt = await fetch(`/api/v1/admin/users?search=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null)
        userId = alt?.data?.[0]?.id
      }
      if (!userId) throw new Error("User not found")
      const cRes = await fetch("/api/v1/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "DIRECT", memberIds: [userId] }) })
      const cData = await cRes.json()
      if (!cData.success) throw new Error(cData.error || "Failed")
      await loadConvs()
      setActiveId(cData.data.id)
      setStartEmail("")
      toast.success("Conversation ready")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally { setStarting(false) }
  }

  async function send() {
    if (!body.trim() || !activeId) return
    const payload = { conversationId: activeId, body: body.trim() }
    const res = await fetch("/api/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!data.success) { toast.error("Send failed"); return }
    socket?.emit("message:send", { conversationId: activeId, ...data.data })
    setMsgs((prev) => [...prev, data.data]); setBody("")
  }

  const activeConv = convs.find((c) => c.id === activeId)

  return (
    <div className="grid gap-2 lg:grid-cols-[360px_1fr]">
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4" />Messages {connected ? <span className="text-xs font-normal text-emerald-600">● live</span> : null}</CardTitle>
          <div className="flex gap-2 pt-2">
            <Input placeholder="Start by email…" value={startEmail} onChange={(e) => setStartEmail(e.target.value)} className="h-8" />
            <Button size="sm" className="cursor-pointer gap-1 h-8" onClick={startConversation} disabled={starting}>{starting ? <Loader2 className="size-3.5 animate-spin" /> : <MessageSquarePlus className="size-3.5" />}Start</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 overflow-auto max-h-[60vh]">
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p> : convs.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations yet" description="Start a conversation by email. Direct and group chats will appear here." />
          ) : convs.map((c) => {
            const other = c.type === "DIRECT" ? c.memberIds.find((m) => m !== myId)?.slice(0,8) ?? "Group" : `Group ${c.groupId?.slice(0,4) ?? ""}`
            const last = c.messages?.[0]
            const isActive = c.id === activeId
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-2 sm:px-3 py-2.5 text-left transition-colors ${isActive ? "bg-muted border-primary/20" : "hover:bg-muted/50"}`}>
                <Avatar className="size-8"><AvatarFallback className="text-xs">{c.type === "GROUP" ? <Users className="size-3.5" /> : other.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.type === "GROUP" ? "Group" : other}</p>
                  <p className="truncate text-xs text-muted-foreground">{last?.body ?? "No messages yet"}</p>
                </div>
                {c.type === "GROUP" && <Badge variant="secondary" className="text-[10px]">Group</Badge>}
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card className="flex min-h-[480px] flex-col">
        {!activeId ? (
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
            <MessageSquare className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Select a conversation or start a new one.</p>
          </CardContent>
        ) : (
          <>
            <CardHeader className="border-b py-3">
              <CardTitle className="text-sm truncate">{activeConv?.type === "GROUP" ? "Group chat" : `Chat with ${activeConv?.memberIds.find((m) => m !== myId)?.slice(0,8) ?? "user"}`}</CardTitle>
            </CardHeader>
            <div className="flex-1 space-y-2 overflow-auto p-2 sm:p-3 max-h-[420px] min-h-[280px]">
              {msgs.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No messages yet — say hello.</p> : msgs.map((m) => {
                const mine = m.senderId === myId
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-2 sm:px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted border"}`}>
                      <p>{m.body}</p>
                      <p className={`mt-1 text-[11px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 border-t p-2 sm:p-3">
              <Input placeholder="Type a message…" value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="h-9" />
              <Button onClick={send} disabled={!body.trim()} className="cursor-pointer gap-1"><Send className="size-4" />Send</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}