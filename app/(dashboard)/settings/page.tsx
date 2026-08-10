"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Bell,
  CircleUserRound,
  KeyRound,
  Mail,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Smartphone,
  Sun,
  UserRound,
  XCircle,
  Heart,
  Shield,
  Laptop,
  Copy,
  Check,
  Download,
  Send,
} from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { authClient, signOut, useSession } from "@/lib/auth-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  changePassword,
  deleteAccount,
  getNotificationPrefs,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  saveNotificationPrefs,
} from "@/lib/actions/settingsActions"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  timezone: z.string().min(1, "Select a timezone"),
})

type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordForm = z.infer<typeof passwordSchema>

type TabId = "profile" | "notifications" | "appearance" | "security" | "account"

const tabs: {
  id: TabId
  label: string
  icon: typeof UserRound
  description: string
}[] = [
  {
    id: "profile",
    label: "Profile",
    icon: UserRound,
    description: "Your name, email, and public details",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Choose when and how we reach you",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Theme and display preferences",
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    description: "Password, two-factor, and sessions",
  },
  {
    id: "account",
    label: "Account",
    icon: CircleUserRound,
    description: "Linked data, preferences, and danger zone",
  },
]

function ToggleRow({
  id,
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  icon: typeof Mail
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  )
}

function SectionHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: typeof UserRound
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-0.5">
        <h3 className="text-base">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function parseUA(uaString?: string) {
  if (!uaString) return { device: "Unknown Device", browser: "Web Browser" }
  const ua = uaString.toLowerCase()
  let device = "Desktop"
  let browser = "Web Browser"

  if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) {
    device = ua.includes("iphone")
      ? "iPhone"
      : ua.includes("ipad")
        ? "iPad"
        : "Mobile Device"
  } else if (ua.includes("macintosh")) {
    device = "Mac"
  } else if (ua.includes("windows")) {
    device = "Windows PC"
  } else if (ua.includes("linux")) {
    device = "Linux PC"
  }

  if (ua.includes("chrome")) {
    browser = "Google Chrome"
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Apple Safari"
  } else if (ua.includes("firefox")) {
    browser = "Mozilla Firefox"
  } else if (ua.includes("edge")) {
    browser = "Microsoft Edge"
  }

  return { device, browser }
}

export default function SettingsPage() {
  const { data: session, isPending, refetch: refetchSession } = useSession()
  const user = session?.user
  const currentSessionId = session?.session?.id
  const name = user?.name ?? "User"
  const email = user?.email ?? ""
  const role = (user?.role as string) ?? "member"
  const twoFactorEnabled = !!(user as any)?.twoFactorEnabled

  const [activeTab, setActiveTab] = useState<TabId>("profile")
  const [direction, setDirection] = useState(1)
  const [isPendingNotifs, startTransitionNotifs] = useTransition()
  const [notifPrefs, setNotifPrefs] = useState({
    emailNewMessage: true,
    emailPrayerUpdate: true,
    pushNewMessage: true,
    pushPrayerUpdate: false,
    emailBroadcast: true,
  })

  // Two-factor state
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false)
  const [twoFactorPassword, setTwoFactorPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [twoFactorStep, setTwoFactorStep] = useState<
    "auth" | "scan" | "backup"
  >("auth")
  const [totpURI, setTotpURI] = useState("")
  const [totpSecret, setTotpSecret] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedBackup, setCopiedBackup] = useState(false)
  const [is2FALoading, setIs2FALoading] = useState(false)

  // Session state
  const [userSessions, setUserSessions] = useState<any[]>([])
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Account deletion state
  const [deletePassword, setDeleteAccountPassword] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const reduceMotion = useReducedMotion()
  const { theme, setTheme } = useTheme()

  // Load preferences and sessions on tab change / mount
  useEffect(() => {
    if (activeTab === "notifications") {
      getNotificationPrefs().then((res) => {
        if (res.success && res.prefs) {
          const p = res.prefs as any
          setNotifPrefs({
            emailNewMessage: p.email?.NEW_MESSAGE ?? true,
            emailPrayerUpdate: p.email?.PRAYER_UPDATE ?? true,
            emailBroadcast: p.email?.ADMIN_BROADCAST ?? true,
            pushNewMessage: p.push?.NEW_MESSAGE ?? true,
            pushPrayerUpdate: p.push?.PRAYER_UPDATE ?? false,
          })
        }
      })
    } else if (activeTab === "security") {
      setIsSessionsLoading(true)
      listSessions()
        .then((res) => {
          if (res.success && res.sessions) {
            setUserSessions(res.sessions)
          }
        })
        .finally(() => setIsSessionsLoading(false))
    }
  }, [activeTab])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email, timezone: "UTC" },
    values: { name, email, timezone: "UTC" },
  })

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    formState: { errors: pwErrors, isSubmitting: isSubmittingPw },
    reset: resetPw,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const handleTabChange = (newId: TabId) => {
    const prevIdx = tabs.findIndex((t) => t.id === activeTab)
    const nextIdx = tabs.findIndex((t) => t.id === newId)
    setDirection(nextIdx > prevIdx ? 1 : -1)
    setActiveTab(newId)
  }

  const handleSaveProfile = async (data: ProfileForm) => {
    try {
      await authClient.updateUser({
        name: data.name,
      })
      await refetchSession()
      toast.success("Profile updated")
    } catch (err) {
      toast.error("Failed to update profile details")
    }
  }

  const handleSaveNotifPrefs = () => {
    startTransitionNotifs(async () => {
      const res = await saveNotificationPrefs({
        email: {
          NEW_MESSAGE: notifPrefs.emailNewMessage,
          PRAYER_UPDATE: notifPrefs.emailPrayerUpdate,
          ADMIN_BROADCAST: notifPrefs.emailBroadcast,
        },
        push: {
          NEW_MESSAGE: notifPrefs.pushNewMessage,
          PRAYER_UPDATE: notifPrefs.pushPrayerUpdate,
        },
      })
      if (res.success) {
        toast.success("Notification preferences saved")
      } else {
        toast.error(res.error || "Failed to save preferences")
      }
    })
  }

  const handleChangePassword = async (data: PasswordForm) => {
    const res = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
    if (res.success) {
      resetPw()
      toast.success("Password changed successfully")
    } else {
      toast.error(res.error || "Failed to update password")
    }
  }

  // 2FA action flows
  const handleStart2FAEnable = async () => {
    setIs2FALoading(true)
    try {
      const res = await authClient.twoFactor.enable({
        password: twoFactorPassword,
      })
      if (res.data) {
        setTotpURI(res.data.totpURI)
        // Extracted secret if any from URI
        const secretMatch = res.data.totpURI.match(/secret=([^&]+)/)
        if (secretMatch) setTotpSecret(secretMatch[1])
        setBackupCodes(res.data.backupCodes)
        setTwoFactorStep("scan")
      } else {
        toast.error("Could not generate setup token. Check your password.")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to begin 2FA setup")
    } finally {
      setIs2FALoading(false)
    }
  }

  const handleVerify2FACode = async () => {
    setIs2FALoading(true)
    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode,
      })
      if (res.error) {
        toast.error(res.error.message || "Invalid setup code")
      } else {
        await refetchSession()
        setTwoFactorStep("backup")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify setup code")
    } finally {
      setIs2FALoading(false)
    }
  }

  const handleDisable2FA = async () => {
    setIs2FALoading(true)
    try {
      const res = await authClient.twoFactor.disable({
        password: twoFactorPassword,
      })
      if (res.error) {
        toast.error(res.error.message || "Could not disable. Check password.")
      } else {
        await refetchSession()
        toast.success("Two-factor authentication disabled")
        setIsDisableModalOpen(false)
        setTwoFactorPassword("")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA")
    } finally {
      setIs2FALoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    toast.promise(
      (async () => {
        const pw = window.prompt(
          "Enter your password to regenerate backup codes:"
        )
        if (!pw) return
        const res = await authClient.twoFactor.generateBackupCodes({
          password: pw,
        })
        if (res.error) throw new Error(res.error.message)
        setBackupCodes(res.data.backupCodes)
        setTwoFactorStep("backup")
        setIs2FAModalOpen(true)
      })(),
      {
        loading: "Generating backup codes...",
        success: "Backup codes generated",
        error: (err) => err.message || "Failed to generate backup codes",
      }
    )
  }

  // Session actions
  const handleRevokeSession = async (token: string) => {
    const res = await revokeSession(token)
    if (res.success) {
      toast.success("Session terminated")
      setUserSessions((prev) => prev.filter((s) => s.token !== token))
    } else {
      toast.error(res.error || "Failed to terminate session")
    }
  }

  const handleRevokeOtherSessions = async () => {
    const res = await revokeOtherSessions()
    if (res.success) {
      toast.success("All other sessions terminated")
      setUserSessions((prev) => prev.filter((s) => s.id === currentSessionId))
    } else {
      toast.error(res.error || "Failed to terminate other sessions")
    }
  }

  // Data export
  const handleRequestEmailExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch("/api/v1/account/export")
      if (res.ok) {
        toast.success("Export finished! Data emailed and downloaded.")
      } else {
        toast.error("Data export failed")
      }
    } catch {
      toast.error("Data export failed")
    } finally {
      setIsExporting(false)
    }
  }

  // Delete account flow
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)
    const res = await deleteAccount({ password: deletePassword })
    setIsDeleting(false)

    if (res.success) {
      toast.success("Account deleted successfully. Goodbye!")
      window.location.href = "/"
    } else {
      toast.error(res.error || "Account deletion failed")
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const themeOptions = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const

  const directional = reduceMotion
    ? { opacity: 0 }
    : { y: direction > 0 ? -24 : 24, opacity: 0 }

  const transition = { type: "spring" as const, stiffness: 340, damping: 32 }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, preferences, and security.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as TabId)}
        orientation="vertical"
        className="w-full"
      >
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-10">
          <aside className="w-full shrink-0 lg:w-60">
            <nav aria-label="Settings sections">
              <TabsList className="flex w-full flex-col items-stretch gap-1.5 rounded-none border-none bg-transparent p-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-medium transition-all outline-none",
                        "hover:bg-muted/60 hover:text-foreground",
                        "data-[state=active]:bg-transparent data-[state=active]:text-foreground",
                        "shadow-none ring-0 after:hidden data-[state=active]:shadow-none data-[state=active]:ring-0",
                        isActive
                          ? "text-foreground"
                          : "border border-border/50 text-muted-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "z-10 size-4 shrink-0",
                          isActive && "text-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span className="z-10">{tab.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="settings-active-indicator"
                          className="absolute inset-0 rounded-lg bg-muted"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          aria-hidden="true"
                        />
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={directional}
                animate={{ y: 0, opacity: 1 }}
                exit={directional}
                transition={transition}
                className="rounded-xl border border-border bg-card p-5 sm:p-7"
              >
                {isPending && activeTab === "profile" ? (
                  <div className="space-y-4" aria-busy="true">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                ) : (
                  <>
                    {activeTab === "profile" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title="Profile"
                          description="This is how other members see you."
                          icon={UserRound}
                        />
                        <Separator />
                        <form
                          onSubmit={handleSubmit(handleSaveProfile)}
                          className="flex flex-col gap-5"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="size-14 border">
                              <AvatarImage
                                src={user?.image ?? undefined}
                                alt={name}
                              />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {email}
                              </p>
                              <Badge
                                variant="secondary"
                                className="mt-0.5 w-fit text-[10px] capitalize"
                              >
                                {role}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="ml-auto cursor-pointer"
                            >
                              Change photo
                            </Button>
                          </div>

                          <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label
                                htmlFor="name"
                                className="text-sm text-muted-foreground"
                              >
                                Full name
                              </Label>
                              <Input
                                id="name"
                                autoComplete="name"
                                className="h-11"
                                aria-invalid={!!errors.name}
                                {...register("name")}
                              />
                              {errors.name && (
                                <p className="text-xs text-destructive">
                                  {errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="email"
                                className="text-sm text-muted-foreground"
                              >
                                Email
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                disabled
                                className="h-11 cursor-not-allowed bg-muted/20 opacity-60"
                                aria-invalid={!!errors.email}
                                {...register("email")}
                              />
                              <p className="text-xs text-muted-foreground">
                                To change your email, please contact support.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="timezone"
                              className="text-sm text-muted-foreground"
                            >
                              Timezone
                            </Label>
                            <Input
                              id="timezone"
                              className="h-11"
                              {...register("timezone")}
                            />
                            <p className="text-xs text-muted-foreground">
                              Used for slot reminders and the calendar.
                            </p>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="cursor-pointer"
                            >
                              {isSubmitting ? "Saving..." : "Save changes"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {activeTab === "notifications" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title="Notifications"
                          description="Control which notifications you receive."
                          icon={Bell}
                        />
                        <Separator />
                        <div className="flex flex-col gap-5">
                          <div>
                            <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                              Email
                            </p>
                            <div className="flex flex-col gap-5">
                              <ToggleRow
                                id="email-new-message"
                                icon={Mail}
                                title="New messages"
                                description="Email me when someone sends me a message"
                                checked={notifPrefs.emailNewMessage}
                                onCheckedChange={(v) =>
                                  setNotifPrefs((p) => ({
                                    ...p,
                                    emailNewMessage: v,
                                  }))
                                }
                              />
                              <ToggleRow
                                id="email-prayer-update"
                                icon={Heart}
                                title="Prayer updates"
                                description="Email me when a prayer request I follow is updated"
                                checked={notifPrefs.emailPrayerUpdate}
                                onCheckedChange={(v) =>
                                  setNotifPrefs((p) => ({
                                    ...p,
                                    emailPrayerUpdate: v,
                                  }))
                                }
                              />
                              <ToggleRow
                                id="email-broadcast"
                                icon={CircleUserRound}
                                title="Broadcasts"
                                description="Receive important updates from the TGAW team"
                                checked={notifPrefs.emailBroadcast}
                                onCheckedChange={(v) =>
                                  setNotifPrefs((p) => ({
                                    ...p,
                                    emailBroadcast: v,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                              Browser push
                            </p>
                            <div className="flex flex-col gap-5">
                              <ToggleRow
                                id="push-new-message"
                                icon={Smartphone}
                                title="New messages"
                                description="Notify me instantly when a message arrives"
                                checked={notifPrefs.pushNewMessage}
                                onCheckedChange={(v) =>
                                  setNotifPrefs((p) => ({
                                    ...p,
                                    pushNewMessage: v,
                                  }))
                                }
                              />
                              <ToggleRow
                                id="push-prayer-update"
                                icon={Heart}
                                title="Prayer updates"
                                description="Notify me when a followed prayer request changes"
                                checked={notifPrefs.pushPrayerUpdate}
                                onCheckedChange={(v) =>
                                  setNotifPrefs((p) => ({
                                    ...p,
                                    pushPrayerUpdate: v,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            className="cursor-pointer"
                            disabled={isPendingNotifs}
                            onClick={handleSaveNotifPrefs}
                          >
                            {isPendingNotifs ? "Saving..." : "Save preferences"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeTab === "appearance" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title="Appearance"
                          description="Choose how TGAW looks on this device."
                          icon={Palette}
                        />
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Theme
                          </Label>
                          <div
                            className="grid grid-cols-3 gap-3"
                            role="radiogroup"
                            aria-label="Theme"
                          >
                            {themeOptions.map((option) => {
                              const Icon = option.icon
                              const isActive = (theme ?? "system") === option.id
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={isActive}
                                  onClick={() => setTheme(option.id)}
                                  className={cn(
                                    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-all outline-none",
                                    "focus-visible:ring-2 focus-visible:ring-ring",
                                    isActive
                                      ? "border-ring bg-muted text-foreground"
                                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                                  )}
                                >
                                  <Icon className="size-5" aria-hidden="true" />
                                  <span>{option.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "security" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title="Security"
                          description="Keep your account safe and secure."
                          icon={ShieldCheck}
                        />
                        <Separator />

                        {/* Two factor card */}
                        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                              <Shield className="size-4" aria-hidden="true" />
                            </span>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">
                                Two-factor authentication
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Add an extra layer of security with an
                                authenticator app.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                twoFactorEnabled ? "default" : "secondary"
                              }
                              className="shrink-0"
                            >
                              {twoFactorEnabled ? "Active" : "Off"}
                            </Badge>
                            {twoFactorEnabled ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRegenerateBackupCodes}
                                >
                                  Codes
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setTwoFactorPassword("")
                                    setIsDisableModalOpen(true)
                                  }}
                                >
                                  Disable
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTwoFactorPassword("")
                                  setTwoFactorCode("")
                                  setTwoFactorStep("auth")
                                  setIs2FAModalOpen(true)
                                }}
                              >
                                Enable
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Change Password form */}
                        <form
                          onSubmit={handleSubmitPw(handleChangePassword)}
                          className="flex flex-col gap-5"
                        >
                          <div className="space-y-2">
                            <Label
                              htmlFor="current-password"
                              className="text-sm text-muted-foreground"
                            >
                              Current password
                            </Label>
                            <Input
                              id="current-password"
                              type="password"
                              autoComplete="current-password"
                              className="h-11"
                              aria-invalid={!!pwErrors.currentPassword}
                              {...registerPw("currentPassword")}
                            />
                            {pwErrors.currentPassword && (
                              <p className="text-xs text-destructive">
                                {pwErrors.currentPassword.message}
                              </p>
                            )}
                          </div>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label
                                htmlFor="new-password"
                                className="text-sm text-muted-foreground"
                              >
                                New password
                              </Label>
                              <Input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                className="h-11"
                                aria-invalid={!!pwErrors.newPassword}
                                {...registerPw("newPassword")}
                              />
                              {pwErrors.newPassword && (
                                <p className="text-xs text-destructive">
                                  {pwErrors.newPassword.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="confirm-password"
                                className="text-sm text-muted-foreground"
                              >
                                Confirm new password
                              </Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                className="h-11"
                                aria-invalid={!!pwErrors.confirmPassword}
                                {...registerPw("confirmPassword")}
                              />
                              {pwErrors.confirmPassword && (
                                <p className="text-xs text-destructive">
                                  {pwErrors.confirmPassword.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              variant="outline"
                              disabled={isSubmittingPw}
                              className="cursor-pointer"
                            >
                              {isSubmittingPw
                                ? "Updating..."
                                : "Update password"}
                            </Button>
                          </div>
                        </form>

                        <Separator />

                        {/* Sessions list */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-sm">
                                Active Sessions
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Devices currently logged into TGAW.
                              </p>
                            </div>
                            {userSessions.length > 1 && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="text-xs"
                                  >
                                    Log out other devices
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will terminate all other active
                                      sessions except for your current browser
                                      session. You will need to log back in on
                                      those devices.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleRevokeOtherSessions}
                                    >
                                      Confirm
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>

                          <div className="flex flex-col gap-3">
                            {isSessionsLoading ? (
                              <div className="space-y-2 py-4">
                                <div className="h-10 w-full animate-pulse rounded-lg bg-muted/60" />
                                <div className="h-10 w-full animate-pulse rounded-lg bg-muted/60" />
                              </div>
                            ) : userSessions.length === 0 ? (
                              <p className="py-4 text-xs text-muted-foreground">
                                No active sessions found.
                              </p>
                            ) : (
                              userSessions.map((sessionItem) => {
                                const { device, browser } = parseUA(
                                  sessionItem.userAgent
                                )
                                const isCurrent =
                                  sessionItem.id === currentSessionId
                                return (
                                  <div
                                    key={sessionItem.id}
                                    className="flex items-center justify-between rounded-xl border bg-muted/10 p-3.5 text-xs"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg border bg-muted/40">
                                        <Laptop className="size-4 text-muted-foreground" />
                                      </span>
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                                          <span>
                                            {device} • {browser}
                                          </span>
                                          {isCurrent && (
                                            <Badge className="h-4 border-none bg-primary/10 px-1 py-0 text-[9px] text-primary">
                                              Current
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                          IP:{" "}
                                          {sessionItem.ipAddress ||
                                            "Unknown IP"}{" "}
                                          • Active:{" "}
                                          {new Date(
                                            sessionItem.createdAt
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    {!isCurrent && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-7 text-xs"
                                          >
                                            Revoke
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Terminate this session?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will instantly log this
                                              device out of your TGAW account.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                handleRevokeSession(
                                                  sessionItem.token
                                                )
                                              }
                                            >
                                              Terminate
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "account" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title="Account"
                          description="Manage your account data and sign out."
                          icon={CircleUserRound}
                        />
                        <Separator />
                        <div className="flex flex-col gap-5">
                          {/* iCal card */}
                          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                                <KeyRound
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium">
                                  iCal calendar feed
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Regenerate your private feed token to log out
                                  all calendar apps.
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                toast.success("Calendar token regenerated")
                              }
                            >
                              Regenerate
                            </Button>
                          </div>

                          {/* GDPR Data Export card */}
                          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                                <Download
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium">
                                  Download your data
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Get a full copy of your posts, messages,
                                  bookmarks, and calendar bookings.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={handleRequestEmailExport}
                                disabled={isExporting}
                              >
                                <Send className="mr-1 size-3.5" />
                                {isExporting ? "Sending..." : "Email copy"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                asChild
                              >
                                <a href="/api/v1/account/export" download>
                                  <Download className="mr-1 size-3.5" />
                                  Download JSON
                                </a>
                              </Button>
                            </div>
                          </div>

                          {/* Sign out */}
                          <div className="rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                                <XCircle
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium">Sign out</p>
                                <p className="text-xs text-muted-foreground">
                                  Sign out of TGAW on this browser session.
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 cursor-pointer"
                              onClick={handleSignOut}
                            >
                              Sign out
                            </Button>
                          </div>

                          {/* Danger Zone / Deletion */}
                          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-background">
                                <XCircle
                                  className="size-4 text-destructive"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium text-destructive">
                                  Delete account
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Permanently remove your account and all
                                  associated data from TGAW.
                                </p>
                              </div>
                            </div>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="mt-4 cursor-pointer"
                                >
                                  Delete account
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="sm:max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive">
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action is completely irreversible. This
                                    will permanently delete your profile, posts,
                                    comments, likes, private chat history, and
                                    bookings.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <div className="space-y-4 py-2 text-xs">
                                  <div className="space-y-2">
                                    <Label htmlFor="delete-confirm-password">
                                      Confirm your password
                                    </Label>
                                    <Input
                                      id="delete-confirm-password"
                                      type="password"
                                      value={deletePassword}
                                      placeholder="Enter current password"
                                      onChange={(e) =>
                                        setDeleteAccountPassword(e.target.value)
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="delete-typed-confirm">
                                      Type{" "}
                                      <span className="font-bold text-foreground">
                                        DELETE
                                      </span>{" "}
                                      to confirm
                                    </Label>
                                    <Input
                                      id="delete-typed-confirm"
                                      value={deleteConfirmation}
                                      placeholder="Type DELETE"
                                      onChange={(e) =>
                                        setDeleteConfirmation(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>

                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() => {
                                      setDeleteAccountPassword("")
                                      setDeleteConfirmation("")
                                    }}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <Button
                                    variant="destructive"
                                    disabled={
                                      isDeleting ||
                                      deleteConfirmation !== "DELETE" ||
                                      !deletePassword
                                    }
                                    onClick={handleDeleteAccount}
                                  >
                                    {isDeleting
                                      ? "Deleting..."
                                      : "Permanently Delete Account"}
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Tabs>

      {/* 2FA Enable Wizard Dialog */}
      <Dialog open={is2FAModalOpen} onOpenChange={setIs2FAModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Secure your TGAW account with TOTP codes.
            </DialogDescription>
          </DialogHeader>

          {twoFactorStep === "auth" && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Please enter your current account password to begin two-factor
                setup.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="two-factor-auth-pw">Current Password</Label>
                <Input
                  id="two-factor-auth-pw"
                  type="password"
                  value={twoFactorPassword}
                  placeholder="Enter current password"
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                />
              </div>
              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-4">
                <Button
                  variant="outline"
                  onClick={() => setIs2FAModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={is2FALoading || !twoFactorPassword}
                  onClick={handleStart2FAEnable}
                >
                  {is2FALoading ? "Generating..." : "Next"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {twoFactorStep === "scan" && (
            <div className="space-y-4 py-2 text-center sm:text-left">
              <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:justify-start">
                {/* Render QR code from free instant zero-dependency QR code API */}
                {totpURI && (
                  <div className="shrink-0 rounded-xl border bg-white p-2.5 shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(totpURI)}`}
                      alt="Two Factor QR Code"
                      width={150}
                      height={150}
                      className="block"
                    />
                  </div>
                )}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground">
                    Scan this QR Code
                  </p>
                  <p>
                    Open your authenticator app (Google Authenticator, Microsoft
                    Authenticator, 1Password, etc.) and scan this code.
                  </p>
                  {totpSecret && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted p-2 font-mono">
                      <span className="max-w-[180px] truncate">
                        {totpSecret}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(totpSecret)
                          toast.success("Secret copied")
                        }}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-left">
                <Label htmlFor="two-factor-code-input">
                  Enter the 6-digit confirmation code
                </Label>
                <Input
                  id="two-factor-code-input"
                  value={twoFactorCode}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
              </div>

              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-4">
                <Button
                  variant="outline"
                  onClick={() => setTwoFactorStep("auth")}
                >
                  Back
                </Button>
                <Button
                  disabled={is2FALoading || twoFactorCode.length < 6}
                  onClick={handleVerify2FACode}
                >
                  {is2FALoading ? "Verifying..." : "Verify & Activate"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {twoFactorStep === "backup" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                <Check className="size-5 shrink-0" />
                <p className="text-sm font-semibold">
                  Two-Factor Authentication Enabled!
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Save these recovery backup codes in a safe place. You can use
                them to log in if you lose access to your authenticator app.
                They will not be displayed again.
              </p>

              <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-3.5 font-mono text-xs">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b pb-1 last:border-0 last:pb-0"
                  >
                    <span className="mr-1 text-muted-foreground">
                      {idx + 1}:
                    </span>
                    <span className="font-bold tracking-wider">{code}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join("\n"))
                    setCopiedBackup(true)
                    toast.success("Backup codes copied")
                  }}
                >
                  <Copy className="mr-1 size-3.5" />
                  {copiedBackup ? "Copied" : "Copy Codes"}
                </Button>
              </div>

              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setIs2FAModalOpen(false)
                    setTwoFactorPassword("")
                    setTwoFactorCode("")
                  }}
                >
                  I have saved my backup codes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Are you sure? This reduces your account security.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="disable-two-factor-pw">Current Password</Label>
              <Input
                id="disable-two-factor-pw"
                type="password"
                value={twoFactorPassword}
                placeholder="Enter password to confirm"
                onChange={(e) => setTwoFactorPassword(e.target.value)}
              />
            </div>
            <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-4">
              <Button
                variant="outline"
                onClick={() => setIsDisableModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={is2FALoading || !twoFactorPassword}
                onClick={handleDisable2FA}
              >
                {is2FALoading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
