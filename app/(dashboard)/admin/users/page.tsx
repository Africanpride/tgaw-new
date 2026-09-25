"use client"

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table"
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Check,
  ShieldCheck,
  Trash2,
  Unlock,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { EmptyState } from "@/components/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient, useSession } from "@/lib/auth-client"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { resendVerificationEmail } from "@/lib/actions/adminActions"
import { useOnlineUserIds } from "@/components/presence/PresenceProvider"
import { cn } from "@/lib/utils"

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric },
})

interface User {
  id: string
  name: string
  email: string
  role: string
  banned: boolean | null
  banReason?: string | null
  image?: string | null
  emailVerified: boolean
  createdAt: string | null
  lastLogin: string | null
}

const EMPTY_USERS: User[] = []

type ActionTarget = "ban" | "delete" | "unban" | "role" | "edit-timezones" | null

const roleColor: Record<string, string> = {
  superadmin: "bg-red-500/15 text-red-700 dark:text-red-400",
  leader: "bg-primary/15 text-primary",
  board: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  coordinator: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  member: "bg-muted text-muted-foreground",
}

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation("common")
  return (
    <Badge
      className={cn("border-0", roleColor[role] ?? roleColor.member)}
      variant="outline"
    >
      {t(`role.${role}`)}
    </Badge>
  )
}

function formatJoinedDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatLastLogin(value: string | null, t: TFunction<"admin">) {
  if (!value) return t("users.never")
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return formatDistanceToNow(date, { addSuffix: true })
}

const ROLE_KEYS = ["member", "coordinator", "board", "leader", "superadmin"] as const

function RolePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (role: string) => void
}) {
  const { t } = useTranslation("admin")
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {ROLE_KEYS.map((role, idx) => {
        const active = value === role
        const isLastOdd = idx === ROLE_KEYS.length - 1 && ROLE_KEYS.length % 2 !== 0
        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            aria-pressed={active}
            className={cn(
              "flex w-full cursor-pointer items-start gap-3 rounded-lg border p-2 text-left transition-all sm:p-3",
              isLastOdd && "sm:col-span-2",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:bg-muted/50"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                active ? "border-primary" : "border-muted-foreground/40"
              )}
            >
              {active && (
                <span className="size-2 rounded-full bg-primary" />
              )}
            </span>
            <span>
              <span className="block text-sm font-medium">{t(`role.${role}`, { ns: "common" })}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t(`users.roleDesc.${role}`)}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function RoleStepIndicator({ step }: { step: 1 | 2 }) {
  const { t } = useTranslation("admin")
  return (
    <div className="flex items-center">
      {([
        { n: 1 as const, label: t("users.role.selectStep") },
        { n: 2 as const, label: t("users.role.confirmStep") },
      ]).map((s, i) => (
        <span key={s.n} className="flex items-center">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              step === s.n ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[11px]",
                step >= s.n
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {s.n}
            </span>
            {s.label}
          </span>
          {i === 0 && (
            <span
              className={cn(
                "mx-2 h-px w-6",
                step >= 2 ? "bg-primary/50" : "bg-muted-foreground/30"
              )}
            />
          )}
        </span>
      ))}
    </div>
  )
}

export default function UserManagementPage() {
  const { t } = useTranslation("admin")
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const onlineIds = useOnlineUserIds()
  const [users, setUsers] = useState<User[]>(EMPTY_USERS)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [actionTarget, setActionTarget] = useState<ActionTarget>(null)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [banReason, setBanReason] = useState("")
  const [isActing, setIsActing] = useState(false)
  const [roleStep, setRoleStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState("")
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [coordinatorTimezones, setCoordinatorTimezones] = useState<string[]>([])
  const [allTimezones, setAllTimezones] = useState<string[]>([])
  const [tzFilter, setTzFilter] = useState("")

  const helper = createColumnHelper<typeof features, User>()

  const columns = helper.columns([
    helper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("users.selectAll")}
          checked={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
              ? "indeterminate"
              : table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("users.selectRow")}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    }),
    helper.accessor("name", {
      header: t("users.col.name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={row.original.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {row.original.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
            {onlineIds.has(row.original.id) && (
              <AvatarBadge
                className="bg-green-600 dark:bg-green-800"
                aria-label={t("users.onlineNow")}
                title={t("users.onlineNow")}
              />
            )}
          </Avatar>
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    }),
    helper.accessor("email", {
      header: t("users.col.email"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
    }),
    helper.accessor("createdAt", {
      header: t("users.col.joined"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatJoinedDate(row.getValue("createdAt"))}
        </span>
      ),
    }),
    helper.accessor("lastLogin", {
      header: t("users.col.lastLogin"),
      cell: ({ row }) => {
        const value = row.getValue("lastLogin") as string | null
        if (!value) {
          return <span className="text-muted-foreground">{t("users.never")}</span>
        }
        return (
          <span
            className="whitespace-nowrap"
            title={new Date(value).toLocaleString()}
          >
            {formatLastLogin(value, t)}
          </span>
        )
      },
    }),
    helper.accessor("emailVerified", {
      header: t("users.col.verification"),
      cell: ({ row }) => {
        const user = row.original
        if (user.emailVerified) {
          return <Badge variant="secondary">{t("users.verified")}</Badge>
        }
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              {t("users.unverified")}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer text-xs"
              disabled={resendingId === user.id}
              onClick={() => resendVerification(user)}
            >
              {resendingId === user.id ? t("users.sending") : t("users.resendEmail")}
            </Button>
          </div>
        )
      },
    }),
    helper.accessor("role", {
      header: t("users.col.role"),
      cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
    }),
    helper.accessor("banned", {
      header: t("users.col.status"),
      cell: ({ row }) =>
        row.getValue("banned") ? (
          <Badge variant="destructive">{t("users.banned")}</Badge>
        ) : (
          <Badge variant="default">{t("users.active")}</Badge>
        ),
    }),
    helper.display({
      id: "actions",
      header: () => <div className="text-right">{t("users.col.actions")}</div>,
      cell: ({ row }) => {
        const user = row.original
        const isSelf = user.id === currentUserId
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 cursor-pointer"
              disabled={isSelf}
              onClick={() => {
                setTargetUser(user)
                setActionTarget("role")
                setRoleStep(1)
                setSelectedRole(user.role)
              }}
            >
              {t("users.changeRole")}
            </Button>
            {user.role === "coordinator" && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 cursor-pointer"
                disabled={isSelf}
                onClick={() => {
                  setTargetUser(user)
                  setActionTarget("edit-timezones")
                  setTzFilter("")
                  // Load existing assignments
                  fetch(`/api/v1/admin/coordinator-assignments?userId=${user.id}`)
                    .then((r) => r.json())
                    .then((data) => {
                      if (data.success) {
                        setCoordinatorTimezones((data.data as { timezone: string }[]).map((r) => r.timezone))
                      }
                    })
                    .catch(() => setCoordinatorTimezones([]))
                }}
              >
                {t("users.editTimezones")}
              </Button>
            )}
            {user.banned ? (
              <Button
                variant="outline"
                size="icon-sm"
                className="h-9 w-9 cursor-pointer"
                aria-label={t("users.unbanUser")}
                title={t("users.unbanUser")}
                onClick={() => {
                  setTargetUser(user)
                  setActionTarget("unban")
                }}
              >
                <Unlock className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon-sm"
                className="h-9 w-9 cursor-pointer text-destructive hover:text-destructive"
                aria-label={t("users.banUser")}
                title={t("users.banUser")}
                disabled={isSelf}
                onClick={() => {
                  setTargetUser(user)
                  setActionTarget("ban")
                }}
              >
                <Ban className="size-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              className="h-9 w-9 cursor-pointer text-destructive hover:text-destructive"
              aria-label={t("users.deleteUser")}
              title={t("users.deleteUser")}
              disabled={isSelf}
              onClick={() => {
                setDeleteConfirm("")
                setTargetUser(user)
                setActionTarget("delete")
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )
      },
    }),
  ])

  const table = useTable({
    features,
    columns,
    data: users,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  })

  async function fetchUsers() {
    try {
      const res = await fetch("/api/v1/admin/users")
      const data = await res.json()
      if (data.success) setUsers(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Load full IANA timezone list once
  useEffect(() => {
    try {
      const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? []
      if (list.length > 0) setAllTimezones(list)
      else setAllTimezones(["UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","Europe/London","Europe/Paris","Africa/Lagos","Asia/Dubai","Asia/Kolkata","Asia/Tokyo","Australia/Sydney"])
    } catch {
      setAllTimezones(["UTC"])
    }
  }, [])

  // When opening role dialog for a coordinator, load existing assignments
  useEffect(() => {
    if (actionTarget !== "role" || !targetUser) {
      setCoordinatorTimezones([])
      setTzFilter("")
      return
    }
    if (selectedRole !== "coordinator" && targetUser.role !== "coordinator") return
    let cancelled = false
    async function loadTz() {
      try {
        const res = await fetch(`/api/v1/admin/coordinator-assignments?userId=${targetUser!.id}`)
        const data = await res.json()
        if (!cancelled && data.success) {
          setCoordinatorTimezones((data.data as { timezone: string }[]).map((r) => r.timezone))
        }
      } catch {
        // ignore
      }
    }
    loadTz()
    return () => { cancelled = true }
  }, [actionTarget, targetUser, selectedRole])

  async function setRole(userId: string, role: string) {
    setIsActing(true)
    const result = await authClient.admin.setRole({
      userId,
      // Better Auth client types default to "admin" | "user" — we bypass them
      // since we configure custom roles on the server (superadmin, leader, etc.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: role as any,
    })
    if (result.error) {
      toast.error(result.error?.message || t("users.toast.roleFailed"))
      setIsActing(false)
      return
    }
    // If coordinator, persist timezone assignments first; require at least one
    if (role === "coordinator") {
      if (coordinatorTimezones.length === 0) {
        toast.error(t("users.toast.tzRequired"))
        setIsActing(false)
        return
      }
      try {
        const res = await fetch("/api/v1/admin/coordinator-assignments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, timezones: coordinatorTimezones }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || t("users.toast.tzFailed"))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("users.toast.tzFailed"))
        setIsActing(false)
        return
      }
    } else {
      // Clearing assignments when demoting from coordinator
      try {
        await fetch("/api/v1/admin/coordinator-assignments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, timezones: [] }),
        })
      } catch {
        // non-fatal
      }
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    )
    toast.success(t("users.toast.roleUpdated"))
    setIsActing(false)
    setTargetUser(null)
    setActionTarget(null)
    setRoleStep(1)
    setSelectedRole("")
    setCoordinatorTimezones([])
    setTzFilter("")
  }

  async function banUser(userId: string, banReason: string) {
    setIsActing(true)
    const result = await authClient.admin.banUser({
      userId,
      banReason: banReason || t("users.ban.reasonPlaceholder"),
    })
    if (!result.error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, banned: true, banReason: banReason || null }
            : u
        )
      )
      toast.success(t("users.toast.userBanned"))
    } else {
      toast.error(result.error?.message || t("users.toast.banFailed"))
    }
    setIsActing(false)
    setTargetUser(null)
    setActionTarget(null)
    setBanReason("")
  }

  async function unbanUser(userId: string) {
    setIsActing(true)
    const result = await authClient.admin.unbanUser({
      userId,
    })
    if (!result.error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, banned: false, banReason: null } : u
        )
      )
      toast.success(t("users.toast.userUnbanned"))
    } else {
      toast.error(result.error?.message || t("users.toast.unbanFailed"))
    }
    setIsActing(false)
    setTargetUser(null)
    setActionTarget(null)
  }

  async function resendVerification(user: User) {
    setResendingId(user.id)
    const res = await resendVerificationEmail({ email: user.email })
    if (res.success) {
      toast.success(t("users.toast.verificationSent", { email: user.email }))
    } else {
      toast.error(res.error || t("users.toast.resendFailed"))
    }
    setResendingId(null)
  }

  async function deleteUser(userId: string) {
    setIsActing(true)
    const result = await authClient.admin.removeUser({
      userId,
    })
    if (!result.error) {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.success(t("users.toast.userDeleted"))
    } else {
      toast.error(result.error?.message || t("users.toast.deleteFailed"))
    }
    setIsActing(false)
    setDeleteConfirm("")
    setTargetUser(null)
    setActionTarget(null)
  }

  const pageCount = table.getPageCount()
  const pagination = table.state.pagination
  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-4 py-4 sm:gap-6 sm:py-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Users className="size-5 sm:size-6" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-xl font-semibold sm:text-2xl">{t("users.title")}</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {t("users.subtitle")}
          </p>
        </div>
        <div className="ml-auto max-sm:w-full max-sm:pt-1">
          <Link
            href="/admin"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border px-2 text-xs hover:bg-muted max-sm:w-full sm:h-8 sm:px-3"
          >
            {t("users.backToAdmin")}
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t("users.members")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("users.show")}</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) =>
                  table.setPageSize(Number(value))
                }
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{t("users.entries")}</span>
            </div>
            <Input
              className="h-10 w-full sm:h-8 sm:w-64"
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={t("users.search")}
              value={globalFilter}
            />
          </div>

          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <span className="flex items-center gap-1">
                            <table.FlexRender header={header} />
                          </span>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={columns.length}
                    >
                      {t("users.loading")}
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      key={row.id}
                    >
                      {row.getAllCells().map((cell) => (
                        <TableCell key={cell.id}>
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={columns.length}
                    >
                      {t("users.noMembers")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: accordion per member (same page slice as the table) */}
          <div className="md:hidden">
            {loading ? (
              <div className="space-y-2" aria-label={t("users.loading")}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border bg-card p-2 sm:p-3"
                  >
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : table.getRowModel().rows.length ? (
              <Accordion type="single" collapsible className="space-y-2">
                {table.getRowModel().rows.map((row) => {
                  const user = row.original
                  const isSelf = user.id === currentUserId
                  return (
                    <AccordionItem
                      key={user.id}
                      value={user.id}
                      className="rounded-lg border bg-card px-2 sm:px-3"
                    >
                      <AccordionTrigger className="gap-2 py-2 hover:no-underline sm:py-3">
                        <span className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Avatar className="size-9 shrink-0">
                            <AvatarImage
                              src={user.image ?? undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {user.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                            {user.banned ? (
                              <AvatarBadge
                                className="bg-red-600 dark:bg-red-800"
                                aria-label={t("users.banned")}
                                title={t("users.banned")}
                              />
                            ) : (
                              onlineIds.has(user.id) && (
                                <AvatarBadge
                                  className="bg-green-600 dark:bg-green-800"
                                  aria-label={t("users.onlineNow")}
                                  title={t("users.onlineNow")}
                                />
                              )
                            )}
                          </Avatar>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm font-medium font-mono">
                              {user.name}
                            </span>
                            <p className="block truncate text-[10px] text-muted-foreground font-sans ">
                              {user.email}
                            </p>
                          </span>
                          <RoleBadge role={user.role} />
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-2 sm:pb-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-muted/40 p-2 sm:p-2.5">
                            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                              {t("users.mobile.status")}
                            </p>
                            <div className="mt-1">
                              {user.banned ? (
                                <Badge variant="destructive">{t("users.banned")}</Badge>
                              ) : (
                                <Badge variant="default">{t("users.active")}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2 sm:p-2.5">
                            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                              {t("users.mobile.joined")}
                            </p>
                            <p className="mt-1 text-sm">
                              {formatJoinedDate(user.createdAt)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2 sm:p-2.5">
                            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                              {t("users.mobile.lastLogin")}
                            </p>
                            <p
                              className="mt-1 text-sm"
                              title={
                                user.lastLogin
                                  ? new Date(user.lastLogin).toLocaleString()
                                  : undefined
                              }
                            >
                              {formatLastLogin(user.lastLogin, t)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2 sm:p-2.5">
                            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                              {t("users.mobile.verification")}
                            </p>
                            <div className="mt-1.5 space-y-1.5">
                              {user.emailVerified ? (
                                <Badge variant="secondary">{t("users.verified")}</Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                >
                                  {t("users.unverified")}
                                </Badge>
                              )}
                              {!user.emailVerified && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-full cursor-pointer text-xs"
                                  disabled={resendingId === user.id}
                                  onClick={() => resendVerification(user)}
                                >
                                  {resendingId === user.id
                                    ? t("users.sending")
                                    : t("users.resendEmail")}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full cursor-pointer"
                            disabled={isSelf}
                            onClick={() => {
                              setTargetUser(user)
                              setActionTarget("role")
                              setRoleStep(1)
                              setSelectedRole(user.role)
                            }}
                          >
                            {t("users.changeRole")}
                          </Button>
                          {user.role === "coordinator" && (
                            <Button
                              variant="outline"
                              className="w-full cursor-pointer"
                              disabled={isSelf}
                              onClick={() => {
                                setTargetUser(user)
                                setActionTarget("edit-timezones")
                                setTzFilter("")
                                fetch(`/api/v1/admin/coordinator-assignments?userId=${user.id}`)
                                  .then((r) => r.json())
                                  .then((data) => {
                                    if (data.success) {
                                      setCoordinatorTimezones((data.data as { timezone: string }[]).map((r) => r.timezone))
                                    }
                                  })
                                  .catch(() => setCoordinatorTimezones([]))
                              }}
                            >
                              {t("users.editTimezones")}
                            </Button>
                          )}
                          <div className="flex gap-2">
                            {user.banned ? (
                              <Button
                                variant="outline"
                                className="flex-1 cursor-pointer"
                                onClick={() => {
                                  setTargetUser(user)
                                  setActionTarget("unban")
                                }}
                              >
                                <Unlock
                                  className="size-4"
                                  aria-hidden="true"
                                />
                                {t("users.mobile.unban")}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                className="flex-1 cursor-pointer text-destructive hover:text-destructive"
                                disabled={isSelf}
                                onClick={() => {
                                  setTargetUser(user)
                                  setActionTarget("ban")
                                }}
                              >
                                <Ban
                                  className="size-4"
                                  aria-hidden="true"
                                />
                                {t("users.mobile.ban")}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="flex-1 cursor-pointer text-destructive hover:text-destructive"
                              disabled={isSelf}
                              onClick={() => {
                                setDeleteConfirm("")
                                setTargetUser(user)
                                setActionTarget("delete")
                              }}
                            >
                              <Trash2
                                className="size-4"
                                aria-hidden="true"
                              />
                              {t("users.mobile.delete")}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <EmptyState
                icon={Users}
                title={t("users.empty.title")}
                description={t("users.empty.description")}
              />
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("users.showing", {
                from: pagination.pageIndex * pagination.pageSize + 1,
                to: Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  totalFiltered
                ),
                total: totalFiltered,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                aria-label={t("users.prevPage")}
                className="h-9 w-9"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{t("users.prevPage")}</span>
              </Button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <Button
                  aria-label={t("users.goToPage", { page })}
                  className="h-9 w-9"
                  key={page}
                  onClick={() => table.setPageIndex(page - 1)}
                  size="icon"
                  variant={
                    pagination.pageIndex + 1 === page ? "default" : "outline"
                  }
                >
                  {page}
                </Button>
              ))}
              <Button
                aria-label={t("users.nextPage")}
                className="h-9 w-9"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size="icon"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{t("users.nextPage")}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ban user dialog */}
      <Dialog
        open={actionTarget === "ban" && !!targetUser}
        onOpenChange={(open) => {
          if (!open && !isActing) {
            setTargetUser(null)
            setActionTarget(null)
            setBanReason("")
          }
        }}
      >
        <DialogContent className="pt-2 sm:pt-6">
          <DialogHeader>
            <DialogTitle>{t("users.ban.title", { name: targetUser?.name })}</DialogTitle>
            <DialogDescription>
              {t("users.ban.description", { name: targetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">{t("users.ban.reason")}</Label>
            <Input
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t("users.ban.reasonPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isActing}
              onClick={() => {
                setTargetUser(null)
                setActionTarget(null)
                setBanReason("")
              }}
            >
              {t("users.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isActing}
              onClick={() => targetUser && banUser(targetUser.id, banReason)}
            >
              {isActing ? t("users.ban.banning") : t("users.ban.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban user dialog */}
      <Dialog
        open={actionTarget === "unban" && !!targetUser}
        onOpenChange={(open) => {
          if (!open && !isActing) {
            setTargetUser(null)
            setActionTarget(null)
          }
        }}
      >
        <DialogContent className="pt-2 sm:pt-6">
          <DialogHeader>
            <DialogTitle>{t("users.unban.title", { name: targetUser?.name })}</DialogTitle>
            <DialogDescription>
              {t("users.unban.description", { name: targetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isActing}
              onClick={() => {
                setTargetUser(null)
                setActionTarget(null)
              }}
            >
              {t("users.cancel")}
            </Button>
            <Button
              disabled={isActing}
              onClick={() => targetUser && unbanUser(targetUser.id)}
            >
              <ShieldCheck className="mr-2 size-4" aria-hidden="true" />
              {isActing ? t("users.unban.unbanning") : t("users.unban.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user dialog */}
      <Dialog
        open={actionTarget === "delete" && !!targetUser}
        onOpenChange={(open) => {
          if (!open && !isActing) {
            setDeleteConfirm("")
            setTargetUser(null)
            setActionTarget(null)
          }
        }}
      >
        <DialogContent className="pt-2 sm:pt-6">
          <DialogHeader>
            <DialogTitle>{t("users.delete.title", { name: targetUser?.name })}</DialogTitle>
            <DialogDescription>
              {t("users.delete.description", { name: targetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              {t("users.delete.typePrefix")}{" "}
              <span className="font-semibold text-foreground">delete account</span>{" "}
              {t("users.delete.typeSuffix")}
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete account"
              autoComplete="off"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isActing}
              onClick={() => {
                setDeleteConfirm("")
                setTargetUser(null)
                setActionTarget(null)
              }}
            >
              {t("users.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isActing || deleteConfirm.trim() !== "delete account"}
              onClick={() => targetUser && deleteUser(targetUser.id)}
            >
              <Trash2 className="mr-2 size-4" aria-hidden="true" />
              {isActing ? t("users.delete.deleting") : t("users.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role — 2-step dialog */}
      <Dialog
        open={actionTarget === "role" && !!targetUser}
        onOpenChange={(open) => {
          if (!open && !isActing) {
            setTargetUser(null)
            setActionTarget(null)
            setRoleStep(1)
            setSelectedRole("")
          }
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl overflow-hidden">
          <DialogHeader className="shrink-0 p-4 pb-3 sm:p-6 sm:pb-4 border-b pr-10">
            <DialogTitle>
              {roleStep === 1
                ? t("users.role.changeTitle", { name: targetUser?.name })
                : t("users.role.confirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {roleStep === 1
                ? t("users.role.stepOneDesc")
                : t("users.role.stepTwoDesc")}
            </DialogDescription>
            <div className="pt-2 sm:pt-3">
              <RoleStepIndicator step={roleStep} />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
            {roleStep === 1 ? (
              <>
                <RolePicker
                  value={selectedRole}
                  onChange={setSelectedRole}
                />
                {selectedRole === "coordinator" && (
                  <div className="space-y-3 rounded-lg border p-2 sm:p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t("users.role.timezones")}</Label>
                      <span className="text-xs text-muted-foreground">{t("users.role.selectedCount", { count: coordinatorTimezones.length })}</span>
                    </div>
                    {coordinatorTimezones.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {coordinatorTimezones.map((tz) => (
                          <Badge key={tz} variant="secondary" className="gap-1 pr-1 text-xs">
                            {tz}
                            <button
                              type="button"
                              aria-label={t("users.role.removeTz", { tz })}
                              onClick={() => setCoordinatorTimezones((prev) => prev.filter((x) => x !== tz))}
                              className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted"
                            >
                              <span aria-hidden="true">×</span>
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Input
                      placeholder={t("users.role.filterTimezones")}
                      value={tzFilter}
                      onChange={(e) => setTzFilter(e.target.value)}
                      className="h-8"
                    />
                    <div className="max-h-36 overflow-auto rounded-xl border">
                      {(allTimezones.filter((tz) => tz.toLowerCase().includes(tzFilter.toLowerCase())).slice(0, 80)).map((tz) => {
                        const active = coordinatorTimezones.includes(tz)
                        return (
                          <label key={tz} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50">
                            <Checkbox
                              checked={active}
                              onCheckedChange={(checked) => {
                                setCoordinatorTimezones((prev) => checked ? [...prev, tz] : prev.filter((x) => x !== tz))
                              }}
                            />
                            <span className="truncate">{tz}</span>
                          </label>
                        )
                      })}
                      {allTimezones.filter((tz) => tz.toLowerCase().includes(tzFilter.toLowerCase())).length === 0 && (
                        <p className="p-2 text-sm text-muted-foreground sm:p-3">{t("users.role.noMatches")}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("users.role.tzHint")}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-2 sm:p-3">
                  <span className="text-sm text-muted-foreground">
                    {t("users.role.currentRole")}
                  </span>
                  <RoleBadge role={targetUser?.role ?? ""} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-2 sm:p-3">
                  <span className="text-sm text-muted-foreground">
                    {t("users.role.newRole")}
                  </span>
                  <RoleBadge role={selectedRole} />
                </div>
                {selectedRole === "coordinator" && (
                  <div className="rounded-lg border p-2 sm:p-3">
                    <p className="text-sm font-medium">{t("users.role.timezonesCount", { count: coordinatorTimezones.length })}</p>
                    {coordinatorTimezones.length === 0 ? (
                      <p className="mt-1 text-sm text-destructive">{t("users.role.noTimezone")}</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {coordinatorTimezones.map((tz) => (
                          <Badge key={tz} variant="secondary" className="text-xs">{tz}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {targetUser?.id === currentUserId && (
                  <p className="text-sm text-muted-foreground">
                    {t("users.role.selfWarn")}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 m-0 rounded-t-none border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            {roleStep === 1 ? (
              <>
                <Button
                  variant="outline"
                  disabled={isActing}
                  onClick={() => {
                    setTargetUser(null)
                    setActionTarget(null)
                    setRoleStep(1)
                    setSelectedRole("")
                  }}
                >
                  {t("users.cancel")}
                </Button>
                <Button
                  disabled={!selectedRole || selectedRole === targetUser?.role}
                  onClick={() => setRoleStep(2)}
                >
                  {t("users.role.continue")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={isActing}
                  onClick={() => setRoleStep(1)}
                >
                  {t("users.role.back")}
                </Button>
                <Button
                  disabled={isActing}
                  onClick={() =>
                    targetUser && setRole(targetUser.id, selectedRole)
                  }
                >
                  <Check className="mr-2 size-4" aria-hidden="true" />
                  {isActing ? t("users.role.saving") : t("users.role.save")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit coordinator timezones dialog */}
      <Dialog
        open={actionTarget === "edit-timezones" && !!targetUser}
        onOpenChange={(open) => {
          if (!open && !isActing) {
            setTargetUser(null)
            setActionTarget(null)
            setCoordinatorTimezones([])
            setTzFilter("")
          }
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg overflow-hidden">
          <DialogHeader className="shrink-0 p-4 pb-3 sm:p-6 sm:pb-4 border-b pr-10">
            <DialogTitle>{t("users.editTimezonesTitle", { name: targetUser?.name })}</DialogTitle>
            <DialogDescription>{t("users.editTimezonesDesc")}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
            <div className="space-y-3 rounded-lg border p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t("users.role.timezones")}</Label>
                <span className="text-xs text-muted-foreground">{t("users.role.selectedCount", { count: coordinatorTimezones.length })}</span>
              </div>
              {coordinatorTimezones.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {coordinatorTimezones.map((tz) => (
                    <Badge key={tz} variant="secondary" className="gap-1 pr-1 text-xs">
                      {tz}
                      <button
                        type="button"
                        aria-label={t("users.role.removeTz", { tz })}
                        onClick={() => setCoordinatorTimezones((prev) => prev.filter((x) => x !== tz))}
                        className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                placeholder={t("users.role.filterTimezones")}
                value={tzFilter}
                onChange={(e) => setTzFilter(e.target.value)}
                className="h-8"
              />
              <div className="max-h-36 overflow-auto rounded-xl border">
                {(allTimezones.filter((tz) => tz.toLowerCase().includes(tzFilter.toLowerCase())).slice(0, 80)).map((tz) => {
                  const active = coordinatorTimezones.includes(tz)
                  return (
                    <label key={tz} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50">
                      <Checkbox
                        checked={active}
                        onCheckedChange={(checked) => {
                          setCoordinatorTimezones((prev) => checked ? [...prev, tz] : prev.filter((x) => x !== tz))
                        }}
                      />
                      <span className="truncate">{tz}</span>
                    </label>
                  )
                })}
                {allTimezones.filter((tz) => tz.toLowerCase().includes(tzFilter.toLowerCase())).length === 0 && (
                  <p className="p-2 text-sm text-muted-foreground sm:p-3">{t("users.role.noMatches")}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("users.role.tzHint")}</p>
            </div>
          </div>

          <DialogFooter className="shrink-0 m-0 rounded-t-none border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={isActing}
              onClick={() => {
                setTargetUser(null)
                setActionTarget(null)
                setCoordinatorTimezones([])
                setTzFilter("")
              }}
            >
              {t("users.cancel")}
            </Button>
            <Button
              disabled={isActing || coordinatorTimezones.length === 0}
              onClick={async () => {
                if (!targetUser) return
                setIsActing(true)
                try {
                  const res = await fetch("/api/v1/admin/coordinator-assignments", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: targetUser.id, timezones: coordinatorTimezones }),
                  })
                  const data = await res.json()
                  if (!data.success) throw new Error(data.error || t("users.toast.tzFailed"))
                  toast.success(t("users.toast.tzUpdated"))
                  setTargetUser(null)
                  setActionTarget(null)
                  setCoordinatorTimezones([])
                  setTzFilter("")
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : t("users.toast.tzFailed"))
                } finally {
                  setIsActing(false)
                }
              }}
            >
              <Check className="mr-2 size-4" aria-hidden="true" />
              {isActing ? t("users.role.saving") : t("users.role.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}