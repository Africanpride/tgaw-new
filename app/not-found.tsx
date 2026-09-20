import { SearchX, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NotFound() {
  const t = await getTranslations("errors")
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4">{t("notFound.title")}</CardTitle>
          <CardDescription>{t("notFound.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-2">
          <Button asChild className="cursor-pointer gap-1.5"><Link href="/" className="cursor-pointer"><ArrowLeft className="size-4" aria-hidden="true" />{t("notFound.home")}</Link></Button>
          <Button variant="outline" asChild className="cursor-pointer gap-1.5"><Link href="/overview" className="cursor-pointer"><Home className="size-4" aria-hidden="true" />{t("notFound.dashboard")}</Link></Button>
        </CardContent>
      </Card>
    </div>
  )
}