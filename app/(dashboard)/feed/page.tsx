"use client"

import { Heart, MessageCircle, PenSquare, Share2, Flag, EyeOff, Loader2, Image as ImageIcon, Vote, Quote as QuoteIcon, BookOpen, FileText, Mic } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/EmptyState"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "@/lib/auth-client"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation("feed")
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
        toast.error(t("toast.feedUnavailable"))
        return
      }
      if (!res.ok || !data.success) {
        if (res.status === 401) toast.error(t("toast.signIn"))
        else toast.error(data?.error ? String(data.error) : t("toast.loadFailed"))
        return
      }
      if (cursor) setPosts((prev) => [...prev, ...data.data])
      else setPosts(data.data)
      setNextCursor(data.nextCursor ?? null)
      setHasMore(!!data.nextCursor)
    } catch (e) {
      console.error("[ERROR] fetchPosts", e instanceof Error ? e.message : String(e))
      toast.error(t("toast.feedUnavailable"))
    }
  }

  useEffect(() => {
    fetchPosts(null).finally(() => setLoading(false))
  }, [])

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error(t("toast.fileTooBig")); return }
    setUploading(true)
    try {
      const signRes = await fetch("/api/v1/uploads/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: "posts/media" }) })
      const sign = await signRes.json()
      if (!sign.success) throw new Error(sign.error || t("toast.signFailed"))
      const fd = new FormData()
      fd.append("file", file); fd.append("api_key", sign.data.apiKey); fd.append("timestamp", String(sign.data.timestamp)); fd.append("signature", sign.data.signature); fd.append("folder", sign.data.folder)
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.data.cloudName}/auto/upload`, { method: "POST", body: fd })
      const j = await up.json()
      if (!j.secure_url) throw new Error(j.error?.message || t("toast.uploadFailed"))
      // store in body as mediaUrls? For MVP, append to body as link or use postData
      // We'll keep a temp mediaUrls array via post body tag
      const current = (newPost as unknown as { mediaUrls?: string[] }).mediaUrls ?? []
      setNewPost({ ...newPost, ...( { mediaUrls: [...current, j.secure_url] } as unknown as object) } as typeof newPost)
      toast.success(t("toast.mediaUploaded"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.uploadFailed"))
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
      if (!newPost.pollQuestion.trim() || opts.length < 2) { toast.error(t("toast.pollNeeds")); return }
      body.poll = { question: newPost.pollQuestion.trim(), options: opts }
    }

    const res = await fetch("/api/v1/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.success) {
      setPosts([data.data, ...posts]); setOpen(false)
      setNewPost({ type: "TEXT", body: "", versePassage: "", linkUrl: "", pollQuestion: "", pollOptions: ["", ""] }); setPollOptions(["", ""])
      toast.success(t("toast.posted"))
    } else {
      toast.error(data.error ? JSON.stringify(data.error) : t("toast.postFailed"))
    }
  }

  async function toggleLike(postId: string) {
    const res = await fetch(`/api/v1/posts/${postId}/likes`, { method: "POST" })
    if (!res.ok) { toast.error(t("toast.likeFailed")); return }
    // optimistic bump
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, _count: { ...p._count, likes: p._count.likes + 1 } } : p))
    // refetch to get true count
    fetchPosts(null)
  }

  async function share(postId: string) {
    const url = `${window.location.origin}/feed#${postId}`
    try { await navigator.clipboard.writeText(url); toast.success(t("toast.linkCopied")) } catch { toast.success(url) }
  }

  async function report() {
    if (!reportPost || !reportReason.trim()) return
    const res = await fetch("/api/v1/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "POST", targetId: reportPost, reason: reportReason.trim() }) })
    const data = await res.json()
    if (!data.success) { toast.error(t("toast.reportFailed")); return }
    toast.success(t("toast.reportSubmitted"))
    setReportPost(null); setReportReason("")
  }

  async function hide(postId: string) {
    const res = await fetch(`/api/v1/posts/${postId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isHidden: true }) })
    const data = await res.json()
    if (!data.success) { toast.error(t("toast.hideFailed")); return }
    setPosts((prev) => prev.filter((p) => p.id !== postId)); toast.success(t("toast.hidden"))
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
        <h2 className="text-2xl tracking-tight">{t("header.title")}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2"><PenSquare aria-hidden="true" className="size-4" />{t("composer.newPost")}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>{t("composer.title")}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>{t("composer.typeLabel")}</Label>
                <Select value={newPost.type} onValueChange={(v) => v && setNewPost({ ...newPost, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{postTypes.map((pt) => <SelectItem key={pt.value} value={pt.value}>{t(`type.${pt.value}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("composer.contentLabel")}</Label>
                <Textarea value={newPost.body} onChange={(e) => setNewPost({ ...newPost, body: e.target.value })} placeholder={newPost.type === "SERMON" ? t("composer.contentPlaceholderSermon") : newPost.type === "ARTICLE" ? t("composer.contentPlaceholderArticle") : newPost.type === "GOSPEL_TRACT" ? t("composer.contentPlaceholderTract") : t("composer.contentPlaceholderDefault")} rows={4} />
              </div>
              {newPost.type === "BIBLE_VERSE" && (
                <div className="flex flex-col gap-2"><Label>{t("composer.passageLabel")}</Label><Input value={newPost.versePassage} onChange={(e) => setNewPost({ ...newPost, versePassage: e.target.value })} placeholder={t("composer.passagePlaceholder")} /></div>
              )}
              {(newPost.type === "LINK" || newPost.type === "ARTICLE" || newPost.type === "GOSPEL_TRACT" || newPost.type === "SERMON") && (
                <div className="flex flex-col gap-2"><Label>{t("composer.linkLabel")}</Label><Input value={newPost.linkUrl} onChange={(e) => setNewPost({ ...newPost, linkUrl: e.target.value })} placeholder={t("composer.linkPlaceholder")} /></div>
              )}
              {newPost.type === "MEDIA" && (
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5"><ImageIcon aria-hidden="true" className="size-3.5" />{t("composer.mediaLabel")}</Label>
                  <Input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleMediaUpload} disabled={uploading} />
                  {uploading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 aria-hidden="true" className="size-3 animate-spin" />{t("composer.uploading")}</span>}
                  {(newPost as unknown as { mediaUrls?: string[] }).mediaUrls?.length ? (
                    <p className="text-xs text-emerald-600">{t("composer.filesReady", { count: (newPost as unknown as { mediaUrls: string[] }).mediaUrls.length })}</p>
                  ) : null}
                </div>
              )}
              {newPost.type === "POLL" && (
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5"><Vote aria-hidden="true" className="size-3.5" />{t("composer.pollLabel")}</Label>
                  <Input value={newPost.pollQuestion} onChange={(e) => setNewPost({ ...newPost, pollQuestion: e.target.value })} placeholder={t("composer.pollQuestionPlaceholder")} />
                  {pollOptions.map((opt, i) => (
                    <Input key={i} value={opt} onChange={(e) => setPollOptions((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))} placeholder={t("composer.pollOptionPlaceholder", { n: i + 1 })} />
                  ))}
                  <Button type="button" variant="outline" size="sm" className="w-fit cursor-pointer" onClick={() => setPollOptions((prev) => [...prev, ""])}>{t("composer.addOption")}</Button>
                </div>
              )}
              <Button onClick={createPost} disabled={uploading} className="cursor-pointer">{uploading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}{t("composer.post")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-2 sm:py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={PenSquare}
          title={t("list.emptyTitle")}
          description={t("list.emptyDescription")}
          actionLabel={t("list.emptyAction")}
          onAction={() => setOpen(true)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <Card key={post.id} id={post.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-3 pt-2 sm:pt-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      {post.type === "BIBLE_VERSE" ? <BookOpen aria-hidden="true" className="size-3" /> : post.type === "QUOTE" ? <QuoteIcon aria-hidden="true" className="size-3" /> : post.type === "SERMON" ? <Mic aria-hidden="true" className="size-3" /> : post.type === "ARTICLE" ? <FileText aria-hidden="true" className="size-3" /> : null}
                      {t(`type.${post.type}`, { defaultValue: post.type.replace("_", " ") })}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                    {isLeader && (
                      <Button variant="ghost" size="sm" className="ml-auto h-6 cursor-pointer text-xs gap-1" onClick={() => hide(post.id)}><EyeOff aria-hidden="true" className="size-3" />{t("card.hide")}</Button>
                    )}
                  </div>
                  {post.body && <p className="text-sm whitespace-pre-wrap">{post.body}</p>}
                  {post.versePassage && <p className="text-sm text-muted-foreground italic">— {post.versePassage}</p>}
                  {post.linkUrl && <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{post.linkUrl}</a>}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {post.mediaUrls.map((url) => url.match(/\.(mp4|webm)$/i) ? <video key={url} src={url} controls className="w-full rounded-lg border" /> : <Image key={url} src={url} alt="Post media" width={1200} height={900} sizes="(max-width: 640px) 100vw, 50vw" unoptimized={!url.includes("res.cloudinary.com")} className="h-auto w-full rounded-lg border object-cover" />)}
                    </div>
                  )}
                  {post.poll && (
                    <div className="rounded-lg border p-2 sm:p-3 space-y-2">
                      <p className="text-sm font-medium">{post.poll.question}</p>
                      {post.poll.options.map((o) => {
                        const total = post.poll!.options.reduce((a, b) => a + b.voterIds.length, 0)
                        const pct = total ? Math.round((o.voterIds.length / total) * 100) : 0
                        return (
                          <button key={o.id} className="flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-sm hover:bg-muted" onClick={async () => {
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
                    <Button variant="ghost" size="sm" className="cursor-pointer gap-1" onClick={() => toggleLike(post.id)}><Heart aria-hidden="true" className="size-4" />{post._count.likes}</Button>
                    <Button variant="ghost" size="sm" className="cursor-pointer gap-1"><MessageCircle aria-hidden="true" className="size-4" />{post._count.comments}</Button>
                    <Button variant="ghost" size="sm" className="cursor-pointer gap-1" onClick={() => share(post.id)}><Share2 aria-hidden="true" className="size-4" />{t("card.share")}</Button>
                    <Button variant="ghost" size="sm" className="ml-auto cursor-pointer gap-1 text-muted-foreground" onClick={() => setReportPost(post.id)}><Flag aria-hidden="true" className="size-3" />{t("card.report")}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="cursor-pointer gap-1.5">
                {loadingMore ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}{t("list.loadMore")}
              </Button>
            </div>
          )}
          <Dialog open={!!reportPost} onOpenChange={(o) => !o && setReportPost(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("report.title")}</DialogTitle><DialogDescription>{t("report.description")}</DialogDescription></DialogHeader>
              <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder={t("report.placeholder")} rows={3} />
              <DialogFooter><Button variant="outline" onClick={() => setReportPost(null)} className="cursor-pointer">{t("report.cancel")}</Button><Button onClick={report} disabled={!reportReason.trim()} className="cursor-pointer">{t("report.submit")}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}