"use client"

import { Heart, MessageCircle, PenSquare, Share2, Flag, EyeOff, Loader2, Image as ImageIcon, Vote, Quote as QuoteIcon, BookOpen, FileText, Mic } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "@/lib/auth-client"

const postTypes = [
  { value: "TEXT", label: "Text" },
  { value: "MEDIA", label: "Media" },
  { value: "LINK", label: "Link" },
  { value: "POLL", label: "Poll" },
  { value: "BIBLE_VERSE", label: "Bible Verse" },
  { value: "QUOTE", label: "Quote" },
  { value: "SERMON", label: "Sermon" },
  { value: "GOSPEL_TRACT", label: "Gospel Tract" },
  { value: "ARTICLE", label: "Article" },
  { value: "PRAYER_REQUEST", label: "Prayer Request" },
  { value: "TESTIMONIAL", label: "Testimonial" },
  { value: "PRAISE_REPORT", label: "Praise Report" },
  { value: "PRAYER_ANSWER", label: "Prayer Answer" },
]

interface Post {
  id: string
  type: string
  body?: string | null
  versePassage?: string | null
  linkUrl?: string | null
  mediaUrls?: string[]
  createdAt: string
  authorId: string
  _count: { comments: number; likes: number }
  poll?: { id: string; question: string; options: { id: string; label: string; voterIds: string[] }[]; closesAt?: string | null } | null
}

export default function FeedPage() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? "member"
  const isLeader = role === "leader" || role === "superadmin"
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [open, setOpen] = useState(false)
  const [reportPost, setReportPost] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [uploading, setUploading] = useState(false)
  const [newPost, setNewPost] = useState({
    type: "TEXT",
    body: "",
    versePassage: "",
    linkUrl: "",
    // poll
    pollQuestion: "",
    pollOptions: ["", ""],
    // sermons etc use body
  })
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])

  async function fetchPosts(cursor?: string | null) {
    try {
      const qp = new URLSearchParams({ limit: "10" })
      if (cursor) qp.set("cursor", cursor)
      const res = await fetch(`/api/v1/posts?${qp.toString()}`)
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!data) {
        toast.error("Feed unavailable — please refresh")
        return
      }
      if (!res.ok || !data.success) {
        if (res.status === 401) toast.error("Please sign in to view the feed")
        else toast.error(data?.error ? String(data.error) : "Failed to load feed")
        return
      }
      if (cursor) setPosts((prev) => [...prev, ...data.data])
      else setPosts(data.data)
      setNextCursor(data.nextCursor ?? null)
      setHasMore(!!data.nextCursor)
    } catch (e) {
      console.error("[ERROR] fetchPosts", e instanceof Error ? e.message : String(e))
      toast.error("Feed unavailable — please refresh")
    }
  }

  useEffect(() => {
    fetchPosts(null).finally(() => setLoading(false))
  }, [])

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error("File must be < 8MB"); return }
    setUploading(true)
    try {
      const signRes = await fetch("/api/v1/uploads/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: "posts/media" }) })
      const sign = await signRes.json()
      if (!sign.success) throw new Error(sign.error || "Sign failed")
      const fd = new FormData()
      fd.append("file", file); fd.append("api_key", sign.data.apiKey); fd.append("timestamp", String(sign.data.timestamp)); fd.append("signature", sign.data.signature); fd.append("folder", sign.data.folder)
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.data.cloudName}/auto/upload`, { method: "POST", body: fd })
      const j = await up.json()
      if (!j.secure_url) throw new Error(j.error?.message || "Upload failed")
      // store in body as mediaUrls? For MVP, append to body as link or use postData
      // We'll keep a temp mediaUrls array via post body tag
      const current = (newPost as unknown as { mediaUrls?: string[] }).mediaUrls ?? []
      setNewPost({ ...newPost, ...( { mediaUrls: [...current, j.secure_url] } as unknown as object) } as typeof newPost)
      toast.success("Media uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally { setUploading(false) }
  }

  async function createPost() {
    const mediaUrls = (newPost as unknown as { mediaUrls?: string[] }).mediaUrls ?? []
    const body: Record<string, unknown> = {
      type: newPost.type,
      body: newPost.body,
      mediaUrls,
    }
    if (newPost.versePassage) body.versePassage = newPost.versePassage
    if (newPost.linkUrl) body.linkUrl = newPost.linkUrl
    if (newPost.type === "POLL") {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean)
      if (!newPost.pollQuestion.trim() || opts.length < 2) { toast.error("Poll needs a question and 2+ options"); return }
      body.poll = { question: newPost.pollQuestion.trim(), options: opts }
    }

    const res = await fetch("/api/v1/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.success) {
      setPosts([data.data, ...posts]); setOpen(false)
      setNewPost({ type: "TEXT", body: "", versePassage: "", linkUrl: "", pollQuestion: "", pollOptions: ["", ""] }); setPollOptions(["", ""])
      toast.success("Posted")
    } else {
      toast.error(data.error ? JSON.stringify(data.error) : "Failed to post")
    }
  }

  async function toggleLike(postId: string) {
    const res = await fetch(`/api/v1/posts/${postId}/likes`, { method: "POST" })
    if (!res.ok) { toast.error("Like failed"); return }
    // optimistic bump
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, _count: { ...p._count, likes: p._count.likes + 1 } } : p))
    // refetch to get true count
    fetchPosts(null)
  }

  async function share(postId: string) {
    const url = `${window.location.origin}/feed#${postId}`
    try { await navigator.clipboard.writeText(url); toast.success("Link copied") } catch { toast.success(url) }
  }

  async function report() {
    if (!reportPost || !reportReason.trim()) return
    const res = await fetch("/api/v1/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "POST", targetId: reportPost, reason: reportReason.trim() }) })
    const data = await res.json()
    if (!data.success) { toast.error("Report failed"); return }
    toast.success("Report submitted — thank you")
    setReportPost(null); setReportReason("")
  }

  async function hide(postId: string) {
    const res = await fetch(`/api/v1/posts/${postId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isHidden: true }) })
    const data = await res.json()
    if (!data.success) { toast.error("Hide failed"); return }
    setPosts((prev) => prev.filter((p) => p.id !== postId)); toast.success("Hidden")
  }

  async function loadMore() {
    if (!hasMore || !nextCursor) return
    setLoadingMore(true)
    await fetchPosts(nextCursor)
    setLoadingMore(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl tracking-tight">Community Feed</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2"><PenSquare className="size-4" />New Post</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>Create a Post</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select value={newPost.type} onValueChange={(v) => v && setNewPost({ ...newPost, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{postTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Content</Label>
                <Textarea value={newPost.body} onChange={(e) => setNewPost({ ...newPost, body: e.target.value })} placeholder={newPost.type === "SERMON" ? "Sermon title & summary…" : newPost.type === "ARTICLE" ? "Article body…" : newPost.type === "GOSPEL_TRACT" ? "Tract content…" : "Share your thoughts…"} rows={4} />
              </div>
              {newPost.type === "BIBLE_VERSE" && (
                <div className="flex flex-col gap-2"><Label>Passage</Label><Input value={newPost.versePassage} onChange={(e) => setNewPost({ ...newPost, versePassage: e.target.value })} placeholder="e.g. John 3:16" /></div>
              )}
              {(newPost.type === "LINK" || newPost.type === "ARTICLE" || newPost.type === "GOSPEL_TRACT" || newPost.type === "SERMON") && (
                <div className="flex flex-col gap-2"><Label>Link URL</Label><Input value={newPost.linkUrl} onChange={(e) => setNewPost({ ...newPost, linkUrl: e.target.value })} placeholder="https://…" /></div>
              )}
              {newPost.type === "MEDIA" && (
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5"><ImageIcon className="size-3.5" />Media</Label>
                  <Input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleMediaUpload} disabled={uploading} />
                  {uploading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Uploading…</span>}
                  {(newPost as unknown as { mediaUrls?: string[] }).mediaUrls?.length ? (
                    <p className="text-xs text-emerald-600">{(newPost as unknown as { mediaUrls: string[] }).mediaUrls.length} file(s) ready</p>
                  ) : null}
                </div>
              )}
              {newPost.type === "POLL" && (
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5"><Vote className="size-3.5" />Poll</Label>
                  <Input value={newPost.pollQuestion} onChange={(e) => setNewPost({ ...newPost, pollQuestion: e.target.value })} placeholder="Question" />
                  {pollOptions.map((opt, i) => (
                    <Input key={i} value={opt} onChange={(e) => setPollOptions((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))} placeholder={`Option ${i+1}`} />
                  ))}
                  <Button type="button" variant="outline" size="sm" className="w-fit cursor-pointer" onClick={() => setPollOptions((prev) => [...prev, ""])}>Add option</Button>
                </div>
              )}
              <Button onClick={createPost} disabled={uploading} className="cursor-pointer">{uploading ? <Loader2 className="size-4 animate-spin" /> : null}Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-4 py-12"><PenSquare className="size-10 text-muted-foreground" /><p className="text-muted-foreground">No posts yet.</p></CardContent></Card>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <Card key={post.id} id={post.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      {post.type === "BIBLE_VERSE" ? <BookOpen className="size-3" /> : post.type === "QUOTE" ? <QuoteIcon className="size-3" /> : post.type === "SERMON" ? <Mic className="size-3" /> : post.type === "ARTICLE" ? <FileText className="size-3" /> : null}
                      {post.type.replace("_"," ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                    {isLeader && (
                      <Button variant="ghost" size="sm" className="ml-auto h-6 cursor-pointer text-xs gap-1" onClick={() => hide(post.id)}><EyeOff className="size-3" />Hide</Button>
                    )}
                  </div>
                  {post.body && <p className="text-sm whitespace-pre-wrap">{post.body}</p>}
                  {post.versePassage && <p className="text-sm text-muted-foreground italic">— {post.versePassage}</p>}
                  {post.linkUrl && <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{post.linkUrl}</a>}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {post.mediaUrls.map((url) => url.match(/\.(mp4|webm)$/i) ? <video key={url} src={url} controls className="w-full rounded-md border" /> : <img key={url} src={url} alt="media" className="w-full rounded-md border object-cover" />)}
                    </div>
                  )}
                  {post.poll && (
                    <div className="rounded-md border p-3 space-y-2">
                      <p className="text-sm font-medium">{post.poll.question}</p>
                      {post.poll.options.map((o) => {
                        const total = post.poll!.options.reduce((a, b) => a + b.voterIds.length, 0)
                        const pct = total ? Math.round((o.voterIds.length / total) * 100) : 0
                        return (
                          <button key={o.id} className="flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm hover:bg-muted" onClick={async () => {
                            await fetch(`/api/v1/posts/${post.id}/poll/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionId: o.id }) })
                            fetchPosts(null)
                          }}>
                            <span className="flex-1 text-left">{o.label}</span>
                            <span className="text-xs text-muted-foreground">{pct}% ({o.voterIds.length})</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="ghost" size="sm" className="cursor-pointer gap-1" onClick={() => toggleLike(post.id)}><Heart className="size-4" />{post._count.likes}</Button>
                    <Button variant="ghost" size="sm" className="cursor-pointer gap-1"><MessageCircle className="size-4" />{post._count.comments}</Button>
                    <Button variant="ghost" size="sm" className="cursor-pointer gap-1" onClick={() => share(post.id)}><Share2 className="size-4" />Share</Button>
                    <Button variant="ghost" size="sm" className="ml-auto cursor-pointer gap-1 text-muted-foreground" onClick={() => setReportPost(post.id)}><Flag className="size-3" />Report</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="cursor-pointer gap-1.5">
                {loadingMore ? <Loader2 className="size-4 animate-spin" /> : null}Load more
              </Button>
            </div>
          )}
          <Dialog open={!!reportPost} onOpenChange={(o) => !o && setReportPost(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Report post</DialogTitle><DialogDescription>Help moderators review this content.</DialogDescription></DialogHeader>
              <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Reason…" rows={3} />
              <DialogFooter><Button variant="outline" onClick={() => setReportPost(null)} className="cursor-pointer">Cancel</Button><Button onClick={report} disabled={!reportReason.trim()} className="cursor-pointer">Submit report</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}