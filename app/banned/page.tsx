import { Ban, Mail, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { headers } from "next/headers"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { email as supportEmail } from "@/config/site"
import { auth } from "@/lib/auth"

export default async function BannedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const sp = await searchParams
  const session = await auth.api.getSession({ headers: await headers() })

  const user = session?.user as
    | {
        name?: string
        email?: string
        banReason?: string | null
        banExpires?: Date | string | null
      }
    | undefined

  const banReason =
    sp.reason ??
    user?.banReason ??
    "Your account has been banned by an administrator."

  let banExpiresText: string | null = null
  if (user?.banExpires) {
    const expires = new Date(user.banExpires)
    if (!Number.isNaN(expires.getTime())) {
      banExpiresText = expires.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md overflow-hidden text-center shadow-lg">
        <div className="flex items-center justify-center gap-2 bg-destructive/10 py-8">
          <Ban className="size-12 text-destructive" aria-hidden="true" />
        </div>
        <CardHeader className="pt-8">
          <CardTitle className="text-2xl font-bold">
            Account suspended
          </CardTitle>
          <CardDescription className="mx-auto max-w-sm text-balance">
            Hi {user?.name?.split(" ")[0] ?? "there"}, your access to TGAW has
            been suspended.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-left">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className="size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Reason
              </span>
            </div>
            <p className="mt-1.5 text-sm text-foreground">{banReason}</p>
            {banExpiresText && (
              <p className="mt-3 text-xs text-muted-foreground">
                Ban expires on{" "}
                <span className="font-medium text-foreground">
                  {banExpiresText}
                </span>
              </p>
            )}
          </div>
          {/* <p className="text-sm text-muted-foreground">
						If you believe this is a mistake, please contact our support
						team and we&apos;ll review your account as soon as possible.
					</p> */}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pb-8">
          <Button variant="outline" className="w-full gap-2" asChild>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                "Account suspension appeal"
              )}&body=${encodeURIComponent(
                `Hi TGAW support team,\n\nMy account has been suspended and I believe this is a mistake.\n\nAccount email: ${user?.email ?? ""}\nReason given: ${banReason}\n\nPlease review my account. Thank you.`
              )}`}
            >
              <Mail className="size-4" aria-hidden="true" />
              Contact support
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            <Link
              href="/"
              className="cursor-pointer text-primary hover:underline"
            >
              Back to home
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
