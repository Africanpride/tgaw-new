"use client"

import { CheckCircle, Shield, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Report {
  id: string
  targetType: string
  targetId: string
  reporterId: string
  reason: string
  status: string
  createdAt: string
}

export default function ModerationQueuePage() {
  const { t } = useTranslation("admin")
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchReports() {
    try {
      const res = await fetch("/api/v1/reports")
      const data = await res.json()
      if (data.success) setReports(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  async function dismissReport(id: string) {
    await fetch(`/api/v1/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    })
    setReports(reports.filter((r) => r.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Shield className="size-6" />
        <h2 className="text-2xl">{t("reports.title")}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.openReports")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("reports.loading")}</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("reports.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.col.type")}</TableHead>
                  <TableHead>{t("reports.col.reason")}</TableHead>
                  <TableHead>{t("reports.col.reporter")}</TableHead>
                  <TableHead>{t("reports.col.date")}</TableHead>
                  <TableHead>{t("reports.col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="secondary">{report.targetType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {report.reason}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {report.reporterId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => dismissReport(report.id)}
                        >
                          <CheckCircle className="mr-1 size-4" />
                          {t("reports.dismiss")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-destructive"
                        >
                          <XCircle className="mr-1 size-4" />
                          {t("reports.hide")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}