import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"

export function VerifyForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn(
        "w-full max-w-md border-none p-6 text-center shadow-sm",
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-col items-center gap-4 text-center">
        <Link href="/" className="cursor-pointer">
          <Image
            src="/images/logos/logoicon.svg"
            alt="Logo"
            width={40}
            height={40}
            priority
          />
        </Link>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl font-medium">
            Verify your email
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            We sent a verification code to your email. Enter the code below to
            verify your identity.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="w-full space-y-6">
          <div className="my-4 flex justify-center gap-2">
            {["slot-1", "slot-2", "slot-3", "slot-4", "slot-5", "slot-6"].map(
              (slotId) => (
                <Input
                  key={slotId}
                  type="text"
                  maxLength={1}
                  className="h-12 w-10 text-center text-lg font-semibold"
                />
              )
            )}
          </div>
          <Button type="submit" className="w-full">
            Verify Now
          </Button>
        </form>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <p>Didn&apos;t get the code?</p>
          <Link className="font-medium text-primary hover:underline" href="#">
            Resend
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
