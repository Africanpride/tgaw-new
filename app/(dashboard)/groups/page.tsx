"use client"

import { Users, UserPlus, Lock, Globe, Image as ImageIcon, Loader2, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"
import { createGroupSchema, type CreateGroupInput } from "@/lib/schemas/groupSchema"

interface Group {
  id: string
  name: string
  description?: string | null
  coverImageUrl?: string | null
  isPrivate: boolean
  ownerId: string
  _count?: { members: number }
  createdAt: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema) as never,
    defaultValues: { name: "", description: "", coverImageUrl: "", isPrivate: false },
  })

  async function fetchGroups() {
    try {
      const res = await fetch("/api/v1/groups")
      const data = await res.json()
      if (data.success) setGroups(data.data)
    } catch {
      toast.error("Failed to load groups")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGroups() }, [])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Cover image must be < 4MB")
      return
    }
    setUploading(true)
    try {
      const signRes = await fetch("/api/v1/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "groups/covers" }),
      })
      const sign = await signRes.json()
      if (!sign.success) throw new Error(sign.error || "Failed to get upload signature")
      const fd = new FormData()
      fd.append("file", file)
      fd.append("api_key", sign.data.apiKey)
      fd.append("timestamp", String(sign.data.timestamp))
      fd.append("signature", sign.data.signature)
      fd.append("folder", sign.data.folder)
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.data.cloudName}/auto/upload`, { method: "POST", body: fd })
      const uploaded = await uploadRes.json()
      if (!uploaded.secure_url) throw new Error(uploaded.error?.message || "Upload failed")
      form.setValue("coverImageUrl", uploaded.secure_url, { shouldDirty: true })
      toast.success("Cover uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: CreateGroupInput & Record<string, unknown>) {
    try {
      const res = await fetch("/api/v1/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to create group")
      setGroups((prev) => [data.data, ...prev])
      toast.success("Group created")
      setOpen(false)
      form.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group")
    }
  }

  if (loading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl tracking-tight"><Users aria-hidden="true" className="size-6" /> Groups</h2>
          <p className="text-sm text-muted-foreground">Bible studies, prayer circles, and fellowship cohorts — private or public.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2"><UserPlus aria-hidden="true" className="size-4" /> Create Group</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a group</DialogTitle>
              <DialogDescription>Private groups require invites; public groups are discoverable to members.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="Morning Watch — Lagos" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="What is this group for?" {...form.register("description")} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover">Cover image</Label>
                <div className="flex items-center gap-2">
                  <Input id="cover" type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploading} className="cursor-pointer" />
                  {uploading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                </div>
                {form.watch("coverImageUrl") && (
                  <div className="relative h-32 w-full overflow-hidden rounded-xl border">
                    <Image src={form.watch("coverImageUrl")!} alt="Cover preview" fill className="object-cover" unoptimized />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Optional — Cloudinary signed upload. Max 4MB.</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-2 sm:p-3">
                <div>
                  <Label htmlFor="isPrivate" className="flex items-center gap-1.5"><Lock aria-hidden="true" className="size-3.5" /> Private</Label>
                  <p className="text-xs text-muted-foreground">Only invited members can see and join.</p>
                </div>
                <Switch id="isPrivate" checked={!!form.watch("isPrivate")} onCheckedChange={(v) => form.setValue("isPrivate", v)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting || uploading} className="cursor-pointer gap-1.5">
                  {form.formState.isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}Create Group
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={Users}
              title="No groups yet"
              description="Create your first group for Bible study, intercession, or community fellowship. Groups get their own chat, member roles, and cover."
              actionLabel="Create Group"
              onAction={() => setOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id} className="overflow-hidden flex flex-col">
              <div className="relative h-28 w-full bg-muted">
                {g.coverImageUrl ? (
                  <Image src={g.coverImageUrl} alt={g.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon aria-hidden="true" className="size-8 opacity-30" />
                  </div>
                )}
                <Badge variant="secondary" className="absolute left-2 top-2 gap-1 text-xs">
                  {g.isPrivate ? <Lock aria-hidden="true" className="size-3" /> : <Globe aria-hidden="true" className="size-3" />}
                  {g.isPrivate ? "Private" : "Public"}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-base">{g.name}</CardTitle>
                {g.description && <CardDescription className="line-clamp-2 text-xs">{g.description}</CardDescription>}
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">{g._count?.members ?? 1} member{(g._count?.members ?? 1) !== 1 ? "s" : ""}</span>
                <Button asChild variant="outline" size="sm" className="h-7 cursor-pointer gap-1 text-xs">
                  <Link href={`/groups/${g.id}`} className="cursor-pointer"><MessageSquare aria-hidden="true" className="size-3" />Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}