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
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { resendVerificationEmail } from "@/lib/actions/adminActions"
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
}

const EMPTY_USERS: User[] = []

type ActionTarget = "ban" | "delete" | "unban" | "role" | null

const roleColor: Record<string, string> = {
  superadmin: "bg-red-500/15 text-red-700 dark:text-red-400",
  leader: "bg-primary/15 text-primary",
  board: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  coordinator: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  member: "bg-muted text-muted-foreground",
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      className={cn("border-0", roleColor[role] ?? roleColor.member)}
      variant="outline"
    >
      {role}
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

const ROLE_DESCRIPTIONS: Record<string, string> = {
  member:
    "Default access — community feed, chat, groups, devotion pages and slot booking.",
  coordinator:
    "Member access plus a timezone-scoped Coordinator Dashboard limited to their assigned timezones.",
  board:
    "Member access plus an org-wide, read-oriented Board Dashboard with leader messaging. No slot, user, or external-link administration.",
  leader:
    "Member access plus the Admin Portal — slot administration, reports, moderation queue, external links and Watch-Leader assignment.",
  superadmin:
    "Full system access. Only superadmin can promote or demote roles via this page.",
}

function RolePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (role: string) => void
}) {
  return (
    <div className="space-y-2">
      {(["member", "coordinator", "board", "leader", "superadmin"] as const).map(
        (role) => {
          const active = value === role
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              aria-pressed={active}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-all",
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
                <span className="block text-sm font-medium">{role}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </span>
              </span>
            </button>
          )
        }
      )}
    </div>
  )
}

function RoleStepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center">
      {([
        { n: 1 as const, label: "Select role" },
        { n: 2 as const, label: "Confirm" },
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
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const [users, setUsers] = useState<User[]>(EMPTY_USERS)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [actionTarget, setActionTarget] = useState<ActionTarget>(null)
  const [banReason, setBanReason] = useState("")
  const [isActing, setIsActing] = useState(false)
  const [roleStep, setRoleStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState("")
  const [resendingId, setResendingId] = useState<string | null>(null)

  const helper = createColumnHelper<typeof features, User>()

  const columns = helper.columns([
    helper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    }),
    helper.accessor("name", {
      header: "Name",
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
          </Avatar>
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    }),
    helper.accessor("email", {
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
    }),
    helper.accessor("createdAt", {
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatJoinedDate(row.getValue("createdAt"))}
        </span>
      ),
    }),
    helper.accessor("emailVerified", {
      header: "Verification",
      cell: ({ row }) => {
        const user = row.original
        if (user.emailVerified) {
          return <Badge variant="secondary">Verified</Badge>
        }
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Unverified
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer text-xs"
              disabled={resendingId === user.id}
              onClick={() => resendVerification(user)}
            >
              {resendingId === user.id ? "Sending..." : "Resend email"}
            </Button>
          </div>
        )
      },
    }),
    helper.accessor("role", {
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
    }),
    helper.accessor("banned", {
      header: "Status",
      cell: ({ row }) =>
        row.getValue("banned") ? (
          <Badge variant="destructive">Banned</Badge>
        ) : (
          <Badge variant="default">Active</Badge>
        ),
    }),
    helper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original
        const isSelf = user.id === currentUserId
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer"
              disabled={isSelf}
              onClick={() => {
                setTargetUser(user)
                setActionTarget("role")
                setRoleStep(1)
                setSelectedRole(user.role)
              }}
            >
              Change role
            </Button>
            {user.banned ? (
              <Button
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 cursor-pointer"
                aria-label="Unban user"
                title="Unban user"
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
                className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                aria-label="Ban user"
                title="Ban user"
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
              className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
              aria-label="Delete user"
              title="Delete user"
              disabled={isSelf}
              onClick={() => {
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

  async function setRole(userId: string, role: string) {
    setIsActing(true)
    const result = await authClient.admin.setRole({
      userId,
      // Better Auth client types default to "admin" | "user" — we bypass them
      // since we configure custom roles on the server (superadmin, leader, etc.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: role as any,
    })
    if (!result.error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      )
      toast.success("Role updated")
    } else {
      toast.error(result.error?.message || "Failed to update role")
    }
    setIsActing(false)
    setTargetUser(null)
    setActionTarget(null)
    setRoleStep(1)
    setSelectedRole("")
  }

  async function banUser(userId: string, banReason: string) {
    setIsActing(true)
    const result = await authClient.admin.banUser({
      userId,
      banReason: banReason || "Violation of community guidelines",
    })
    if (!result.error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, banned: true, banReason: banReason || null }
            : u
        )
      )
      toast.success("User banned")
    } else {
      toast.error(result.error?.message || "Failed to ban user")
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
      toast.success("User unbanned")
    } else {
      toast.error(result.error?.message || "Failed to unban user")
    }
    setIsActing(false)
    setTargetUser(null)
    setActionTarget(null)
  }

  async function resendVerification(user: User) {
    setResendingId(user.id)
    const res = await resendVerificationEmail({ email: user.email })
    if (res.success) {
      toast.success(`Verification email sent to ${user.email}`)
    } else {
      toast.error(res.error || "Failed to send verification email")
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
      toast.success("User deleted")
    } else {
      toast.error(result.error?.message || "Failed to delete user")
    }
    setIsActing(false)
    setTargetUser(null)
    setActionTarget(null)
  }

  const pageCount = table.getPageCount()
  const pagination = table.state.pagination
  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex items-center gap-2">
        <Users className="size-6" />
        <h2 className="text-2xl">User Management</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
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
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
            <Input
              className="h-8 w-full sm:w-64"
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search members..."
              value={globalFilter}
            />
          </div>

          <div className="rounded-lg border">
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
                      Loading members...
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
                      No members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalFiltered
              )}{" "}
              of {totalFiltered} members
            </p>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Previous page"
                className="h-8 w-8"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Previous page</span>
              </Button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <Button
                  aria-label={`Go to page ${page}`}
                  className="h-8 w-8"
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
                aria-label="Next page"
                className="h-8 w-8"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size="icon"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Next page</span>
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
        <DialogContent className="pt-6">
          <DialogHeader>
            <DialogTitle>Ban {targetUser?.name}</DialogTitle>
            <DialogDescription>
              This will immediately restrict {targetUser?.name ?? "this user"}{" "}
              from accessing TGAW. You can unban them anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason</Label>
            <Input
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Violation of community guidelines"
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isActing}
              onClick={() => targetUser && banUser(targetUser.id, banReason)}
            >
              {isActing ? "Banning..." : "Ban user"}
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
        <DialogContent className="pt-6">
          <DialogHeader>
            <DialogTitle>Unban {targetUser?.name}</DialogTitle>
            <DialogDescription>
              Restore {targetUser?.name ?? "this user"}'s access to TGAW?
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
              Cancel
            </Button>
            <Button
              disabled={isActing}
              onClick={() => targetUser && unbanUser(targetUser.id)}
            >
              <ShieldCheck className="mr-2 size-4" aria-hidden="true" />
              {isActing ? "Unbanning..." : "Unban user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user dialog */}
      <Dialog
        open={actionTarget === "delete" && !!targetUser}
        onOpenChange={(open) => {
          if (!open && !isActing) {
            setTargetUser(null)
            setActionTarget(null)
          }
        }}
      >
        <DialogContent className="pt-6">
          <DialogHeader>
            <DialogTitle>Delete {targetUser?.name}</DialogTitle>
            <DialogDescription>
              This permanently deletes {targetUser?.name ?? "this user"} and all
              of their data. This action cannot be undone.
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isActing}
              onClick={() => targetUser && deleteUser(targetUser.id)}
            >
              <Trash2 className="mr-2 size-4" aria-hidden="true" />
              {isActing ? "Deleting..." : "Delete user"}
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
        <DialogContent className="pt-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {roleStep === 1
                ? `Change role for ${targetUser?.name}`
                : "Confirm role change"}
            </DialogTitle>
            <DialogDescription>
              {roleStep === 1
                ? "Choose the new role for this member. You'll review the change before saving."
                : "Review the role change before applying it."}
            </DialogDescription>
          </DialogHeader>

          <div className="border-b pb-3">
            <RoleStepIndicator step={roleStep} />
          </div>

          {roleStep === 1 ? (
            <>
              <RolePicker
                value={selectedRole}
                onChange={setSelectedRole}
              />
              <DialogFooter>
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
                  Cancel
                </Button>
                <Button
                  disabled={!selectedRole || selectedRole === targetUser?.role}
                  onClick={() => setRoleStep(2)}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">
                    Current role
                  </span>
                  <RoleBadge role={targetUser?.role ?? ""} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">
                    New role
                  </span>
                  <RoleBadge role={selectedRole} />
                </div>
                {targetUser?.id === currentUserId && (
                  <p className="text-sm text-muted-foreground">
                    You&apos;re changing your own role. If you demote yourself,
                    you may lose access to this page.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={isActing}
                  onClick={() => setRoleStep(1)}
                >
                  Back
                </Button>
                <Button
                  disabled={isActing}
                  onClick={() =>
                    targetUser && setRole(targetUser.id, selectedRole)
                  }
                >
                  <Check className="mr-2 size-4" aria-hidden="true" />
                  {isActing ? "Saving..." : "Save role"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}