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
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { authClient } from "@/lib/auth-client"
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
  image?: string | null
}

const EMPTY_USERS: User[] = []

const roleColor: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  moderator: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
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

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(EMPTY_USERS)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

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
      header: () => <div className="text-right">Change Role</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Select
            value={row.original.role}
            onValueChange={(v) => {
              if (v) setRole(row.original.id, v)
            }}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
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
    const result = await authClient.admin.setRole({
      userId,
      role: role as "admin" | "user",
    })
    if (!result.error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      )
    }
  }

  const pageCount = table.getPageCount()
  const pagination = table.state.pagination
  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-6">
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
    </div>
  )
}