"use client"

import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Bell,
  CircleUserRound,
  KeyRound,
  Languages,
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
import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useTheme } from "@/components/theme-provider"
import { CountryDropdown } from "@/components/country-dropdown"
import { PhoneInput } from "@/components/phone-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import i18n from "@/i18n/client"
import { LOCALES, LOCALE_NAMES, LOCALE_COOKIE_NAME, type Locale } from "@/i18n/config"
import { useEnabledLocales } from "@/hooks/use-enabled-locales"
import type { TFunction } from "i18next"
import { resolveCountryAlpha3, resolveCountryAlpha2 } from "@/lib/countries"
import { phoneSchema } from "@/lib/schemas/phoneSchema"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  getProfile,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  saveNotificationPrefs,
  setPassword,
  updateProfile,
} from "@/lib/actions/settingsActions"
import { AvatarUploadDialog } from "@/components/settings/AvatarUploadDialog"
import { IconTile } from "@/components/IconTile"
import { sectionLabelClass } from "@/components/eyebrow"
import { getAllTimezones } from "@/lib/timezones"

const TIMEZONE_OPTIONS = getAllTimezones().map((tz) => {
  try {
    const fmt = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" })
    const parts = fmt.formatToParts(new Date())
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? ""
    return { value: tz, label: `${offset ? `(${offset}) ` : ""}${tz.replaceAll("_", " ")}` }
  } catch {
    return { value: tz, label: tz }
  }
})

const AGE_RANGES = [
  "under-18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65-plus",
] as const

type TabId = "profile" | "notifications" | "appearance" | "security" | "account"

const tabs: {
  id: TabId
  icon: typeof UserRound
}[] = [
  { id: "profile", icon: UserRound },
  { id: "notifications", icon: Bell },
  { id: "appearance", icon: Palette },
  { id: "security", icon: ShieldCheck },
  { id: "account", icon: CircleUserRound },
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
    <div className="flex items-center justify-between gap-5">
      <div className="flex items-start gap-3">
        <IconTile icon={Icon} size="md" tone="border bg-muted/50" iconClassName="size-4" className="mt-0.5" />
        <div className="space-y-0.5">
          <h6 className="text-sm font-medium">{title}</h6>
          <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">{description}</p>
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
    <div className="flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-muted/50">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-0.5">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="max-w-5xl text-xs sm:text-sm font-medium text-muted-foreground/80">
          {description}
        </p>
      </div>
    </div>
  )
}

function parseUA(uaString: string | undefined, t: TFunction<"settings">) {
  if (!uaString) return { device: t("device.unknown"), browser: t("device.browser") }
  const ua = uaString.toLowerCase()
  let device = t("device.desktop")
  let browser = t("device.browser")

  if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) {
    device = ua.includes("iphone")
      ? "iPhone"
      : ua.includes("ipad")
        ? "iPad"
        : t("device.mobile")
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

function ThemePreview({ variant }: { variant: "light" | "dark" | "system" }) {
  if (variant === "system") {
    return (
        <div className="mb-2.5 w-full overflow-hidden rounded-xl border">
        <div className="flex items-center gap-1 border-b px-2 py-1">
          <div className="h-1 w-1 rounded-full bg-red-400" />
          <div className="h-1 w-1 rounded-full bg-amber-400" />
          <div className="h-1 w-1 rounded-full bg-emerald-400" />
        </div>
        <div className="flex h-10">
          <div className="flex-1 bg-white p-1.5">
            <div className="h-1 w-3/4 rounded bg-gray-200" />
            <div className="mt-1 h-0.5 w-1/2 rounded bg-gray-100" />
            <div className="mt-1 h-0.5 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="flex-1 bg-gray-900 p-1.5">
            <div className="h-1 w-3/4 rounded bg-gray-700" />
            <div className="mt-1 h-0.5 w-1/2 rounded bg-gray-800" />
            <div className="mt-1 h-0.5 w-2/3 rounded bg-gray-800" />
          </div>
        </div>
      </div>
    )
  }

  const light = variant === "light"
  return (
    <div
      className={`mb-2.5 w-full overflow-hidden rounded-xl border ${
        light ? "border-gray-200 bg-white" : "border-gray-700 bg-gray-900"
      }`}
    >
      <div
        className={`flex items-center gap-1 border-b px-2 py-1 ${
          light ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-800"
        }`}
      >
        <div className="h-1 w-1 rounded-full bg-red-400" />
        <div className="h-1 w-1 rounded-full bg-amber-400" />
        <div className="h-1 w-1 rounded-full bg-emerald-400" />
      </div>
      <div className="flex h-10">
        <div
          className={`w-8 border-r p-1 ${
            light ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-800"
          }`}
        >
          <div
            className={`h-0.5 w-full rounded ${light ? "bg-gray-400" : "bg-gray-500"}`}
          />
          <div
            className={`mt-1 h-0.5 w-full rounded ${light ? "bg-gray-200" : "bg-gray-700"}`}
          />
          <div
            className={`mt-1 h-0.5 w-full rounded ${light ? "bg-gray-200" : "bg-gray-700"}`}
          />
          <div
            className={`mt-1 h-0.5 w-full rounded ${light ? "bg-gray-200" : "bg-gray-700"}`}
          />
        </div>
        <div className="flex-1 p-1.5">
          <div
            className={`h-1 w-3/4 rounded ${light ? "bg-gray-200" : "bg-gray-700"}`}
          />
          <div
            className={`mt-1 h-0.5 w-1/2 rounded ${light ? "bg-gray-100" : "bg-gray-800"}`}
          />
          <div className="mt-1.5 flex gap-1">
            <div
              className={`h-3 flex-1 rounded ${light ? "bg-gray-100" : "bg-gray-800"}`}
            />
            <div
              className={`h-3 flex-1 rounded ${light ? "bg-gray-100" : "bg-gray-800"}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function PushSubscriptionManager() {
  const { t } = useTranslation("settings")
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("default");
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBusy, setIsBusy] = React.useState(false);
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  const refresh = React.useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }
    setPermission(Notification.permission);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    // register sw if not already
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [refresh]);

  const handleEnable = async () => {
    if (!("Notification" in window)) {
      toast.error(t("push.notSupported"));
      return;
    }
    setIsBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error(perm === "denied" ? t("push.blockedToast") : t("push.noPermission"));
        setIsBusy(false);
        return;
      }
      if (!vapidKey) {
        toast.error(t("push.noVapidToast"));
        setIsBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      // ensure sw is registered
      let swReg: ServiceWorkerRegistration | null = reg;
      if (!swReg) {
        swReg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      }
      const existing = await swReg.pushManager.getSubscription();
      if (existing) {
        // already subscribed — sync to backend
        const json = existing.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
        await fetch("/api/v1/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
        setIsSubscribed(true);
        toast.success(t("push.enabledToast"));
        setIsBusy(false);
        return;
      }
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
      const json = sub.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
      const res = await fetch("/api/v1/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ? JSON.stringify(j.error) : t("push.saveFailed"));
      }
      setIsSubscribed(true);
      toast.success(t("push.enabledToast"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("push service")) {
        toast.error(
          t("push.unavailable"),
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async () => {
    setIsBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch(`/api/v1/push?endpoint=${encodeURIComponent(endpoint)}`, { method: "DELETE" }).catch(() => {});
      }
      setIsSubscribed(false);
      toast.success(t("push.disabledToast"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setIsBusy(false);
    }
  };

  const handleTest = async () => {
    try {
      const res = await fetch("/api/v1/push/test", { method: "POST" });
      const j = await res.json().catch(() => null);
      if (res.ok) {
        const d = j?.data as { sent?: number; failed?: number } | null;
        toast.success(d?.sent && d.sent > 1 ? t("push.testSentMany", { count: d.sent }) : t("push.testSent"));
      } else {
        toast.error(j?.error ?? t("push.testFailed"));
      }
    } catch {
      toast.error(t("push.testFailed"));
    }
  };

  if (isLoading) return <div className="h-10 animate-pulse rounded-xl bg-muted/40" />;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-2 sm:p-4">
      <div className="flex items-start gap-3">
        <IconTile icon={Smartphone} size="md" tone="border bg-muted/50" iconClassName="size-4" />
        <div className="space-y-0.5">
          <h6 className="text-sm font-medium">{t("push.title")}</h6>
          <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
            {permission === "unsupported" ? t("push.unsupported") : permission === "denied" ? t("push.blocked") : isSubscribed ? t("push.enabled") : t("push.prompt")}
          </p>
          {permission === "default" && !vapidKey && <p className="max-w-5xl text-xs sm:text-sm text-amber-600">{t("push.noVapid")}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {isSubscribed ? (
          <>
            {/* <Button variant="outline" size="sm" className="cursor-pointer" disabled={isBusy} onClick={handleTest}>Test</Button> */}
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={isBusy} onClick={handleDisable}>{isBusy ? "..." : t("push.disable")}</Button>
          </>
        ) : (
          <Button size="sm" className="cursor-pointer" disabled={isBusy || permission === "denied" || permission === "unsupported"} onClick={handleEnable}>{isBusy ? "..." : t("push.enable")}</Button>
        )}
      </div>
    </div>
  );
}

function LanguageSection() {
  const router = useRouter()
  const { t } = useTranslation("settings")
  const { locales: enabledLocales } = useEnabledLocales()
  const [locale, setLocale] = useState<string>(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(
        new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`)
      )
      if (match?.[1] && (LOCALES as readonly string[]).includes(match[1])) {
        return match[1]
      }
    }
    return i18n.language?.split("-")[0] ?? "en"
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleLocaleChange = async (value: string) => {
    const next = value as Locale
    setLocale(next)
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error("locale update failed")
      document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      await i18n.changeLanguage(next)
      router.refresh()
      toast.success(t("language.saved"))
    } catch {
      toast.error(t("language.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-2 sm:p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
          <Languages className="size-4" aria-hidden="true" />
        </span>
        <div className="space-y-0.5">
          <h6 className="text-sm font-medium">{t("language.title")}</h6>
          <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
            {t("language.description")}
          </p>
        </div>
      </div>
      <RadioGroup
        value={locale}
        onValueChange={handleLocaleChange}
        disabled={isSaving}
        aria-label={t("language.title")}
        className="grid gap-2 sm:grid-cols-2"
      >
        {LOCALES.filter((loc) => enabledLocales.includes(loc)).map((loc) => (
          <Label
            key={loc}
            htmlFor={`lang-${loc}`}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50 sm:p-3",
              locale === loc
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <RadioGroupItem value={loc} id={`lang-${loc}`} />
            <span className="text-sm font-medium">{LOCALE_NAMES[loc]}</span>
          </Label>
        ))}
      </RadioGroup>
      {isSaving && (
        <p className="text-xs text-muted-foreground">{t("language.saving")}</p>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation("settings")
  const { data: session, isPending, refetch: refetchSession } = useSession()
  const user = session?.user
  const currentSessionId = session?.session?.id
  const name = user?.name ?? t("profile.fallbackName")
  const email = user?.email ?? ""
  const role = (user?.role as string) ?? "member"
  const twoFactorEnabled = user?.twoFactorEnabled ?? false
  const hasPassword = user?.hasPassword ?? false

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
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false)
  const [regenStep, setRegenStep] = useState<"auth" | "done">("auth")
  const [regenPassword, setRegenPassword] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Session state
  const [userSessions, setUserSessions] = useState<
    Array<{
      id: string
      token: string
      ipAddress?: string | null
      userAgent?: string | null
      createdAt: Date | string
    }>
  >([])
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Account deletion state
  const [deletePassword, setDeleteAccountPassword] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Set password state (for OAuth users without a password)
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isSettingPassword, setIsSettingPassword] = useState(false)

  // Profile data from UserProfile
  const [profileData, setProfileData] = useState<{
    phone: string
    country: string
    sex: "male" | "female"
    ageRange:
      "under-18" | "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65-plus"
    timezone: string
  } | null>(null)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [tzOpen, setTzOpen] = useState(false)
  const [tzFilter, setTzFilter] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const reduceMotion = useReducedMotion()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  // Load profile data on mount
  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.success && res.profile) {
          setProfileData(res.profile)
        }
      })
  }, [])

  // Load preferences and sessions on tab change / mount
  useEffect(() => {
    if (activeTab === "notifications") {
      getNotificationPrefs().then((res) => {
        if (res.success && res.prefs) {
          const p = res.prefs as {
            email?: Record<string, boolean>
            push?: Record<string, boolean>
          }
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

  const profileSchema = React.useMemo(
    () =>
      z.object({
        name: z.string().min(2, t("validation.nameMin")),
        email: z.string().email(t("validation.email")),
        phone: phoneSchema,
        country: z.string().min(1, t("validation.country")),
        sex: z.enum(["male", "female"], { message: t("validation.sex") }),
        ageRange: z.enum(
          ["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65-plus"],
          { message: t("validation.ageRange") }
        ),
        timezone: z.string().min(1, t("validation.timezone")),
      }),
    [t]
  )
  type ProfileForm = z.infer<typeof profileSchema>

  const passwordSchema = React.useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t("validation.currentPassword")),
          newPassword: z.string().min(8, t("validation.newPassword")),
          confirmPassword: z.string().min(1, t("validation.confirmPassword")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("validation.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  )
  type PasswordForm = z.infer<typeof passwordSchema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name,
      email,
      phone: "",
      country: "",
      sex: "male",
      ageRange: "25-34",
      timezone: "UTC",
    },
    values: {
      name,
      email,
      phone: profileData?.phone ?? "",
      country: profileData?.country ?? "",
      sex: profileData?.sex ?? "male",
      ageRange: profileData?.ageRange ?? "25-34",
      timezone: profileData?.timezone ?? "UTC",
    },
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
      const res = await updateProfile({
        name: data.name,
        phone: data.phone,
        country: data.country,
        sex: data.sex,
        ageRange: data.ageRange,
        timezone: data.timezone,
      })
      if (res.success) {
        await refetchSession({ query: { disableCookieCache: true } })
        toast.success(t("toast.profileUpdated"))
      } else {
        toast.error(res.error || t("toast.profileFailed"))
      }
    } catch {
      toast.error(t("toast.profileDetailsFailed"))
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
        toast.success(t("toast.notifSaved"))
      } else {
        toast.error(res.error || t("toast.notifFailed"))
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
      toast.success(t("toast.passwordChanged"))
    } else {
      toast.error(res.error || t("toast.passwordFailed"))
    }
  }

  const handleSetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error(t("toast.passwordMismatch"))
      return
    }
    if (newPassword.length < 8) {
      toast.error(t("toast.passwordMin"))
      return
    }
    setIsSettingPassword(true)
    const res = await setPassword({ newPassword })
    setIsSettingPassword(false)
    if (res.success) {
      toast.success(t("toast.passwordSet"))
      setNewPassword("")
      setConfirmNewPassword("")
      refetchSession({ query: { disableCookieCache: true } })
    } else {
      toast.error(res.error || t("toast.setPasswordFailed"))
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
        toast.error(t("toast.setupTokenFailed"))
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toast.setupFailed"))
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
        toast.error(res.error.message || t("toast.codeInvalid"))
      } else {
        await refetchSession({ query: { disableCookieCache: true } })
        setTwoFactorStep("backup")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toast.verifyFailed"))
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
        toast.error(res.error.message || t("toast.disableFailed"))
      } else {
        await refetchSession({ query: { disableCookieCache: true } })
        toast.success(t("toast.tfaDisabled"))
        setIsDisableModalOpen(false)
        setTwoFactorPassword("")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toast.disableError"))
    } finally {
      setIs2FALoading(false)
    }
  }

  const handleRegenerateBackupCodes = () => {
    setRegenPassword("")
    setRegenStep("auth")
    setCopiedBackup(false)
    setIsRegenModalOpen(true)
  }

  const handleConfirmRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const res = await authClient.twoFactor.generateBackupCodes({
        password: regenPassword,
      })
      if (res.error) throw new Error(res.error.message)
      setBackupCodes(res.data.backupCodes)
      setRegenStep("done")
      toast.success(t("toast.codesGenerated"))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toast.codesFailed"))
    } finally {
      setIsRegenerating(false)
    }
  }

  // Session actions
  const handleRevokeSession = async (token: string) => {
    const res = await revokeSession(token)
    if (res.success) {
      toast.success(t("toast.sessionEnded"))
      setUserSessions((prev) => prev.filter((s) => s.token !== token))
    } else {
      toast.error(res.error || t("toast.revokeFailed"))
    }
  }

  const handleRevokeOtherSessions = async () => {
    const res = await revokeOtherSessions()
    if (res.success) {
      toast.success(t("toast.otherSessionsEnded"))
      setUserSessions((prev) => prev.filter((s) => s.id === currentSessionId))
    } else {
      toast.error(res.error || t("toast.revokeOthersFailed"))
    }
  }

  // Data export
  const handleRequestEmailExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch("/api/v1/account/export")
      if (res.ok) {
        toast.success(t("toast.exportDone"))
      } else {
        toast.error(t("toast.exportFailed"))
      }
    } catch {
      toast.error(t("toast.exportFailed"))
    } finally {
      setIsExporting(false)
    }
  }

  // Delete account flow
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error(t("toast.deleteConfirm"))
      return
    }

    setIsDeleting(true)
    const res = await deleteAccount({ password: deletePassword })
    setIsDeleting(false)

    if (res.success) {
      toast.success(t("toast.accountDeleted"))
      await signOut()
      router.push("/")
    } else {
      toast.error(res.error || t("toast.deleteFailed"))
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const themeOptions = [
    { id: "light", labelKey: "appearance.light", icon: Sun },
    { id: "dark", labelKey: "appearance.dark", icon: Moon },
    { id: "system", labelKey: "appearance.system", icon: Monitor },
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-light tracking-tight">{t("title")}</h1>
        <p className="max-w-5xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as TabId)}
        className="w-full"
      >
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <aside className="w-full min-w-0 shrink-0 lg:w-64">
            <nav aria-label={t("nav.sections")} className="w-full">
              <TabsList className="!h-auto group-data-[orientation=horizontal]/tabs:!h-auto group-data-[orientation=vertical]/tabs:!h-auto flex w-full !flex-row flex-nowrap items-stretch gap-1 rounded-none border-none bg-transparent p-0 pb-1 lg:!flex-col lg:items-stretch lg:gap-1.5 lg:pb-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "relative flex !h-auto min-w-0 shrink-0 cursor-pointer items-center justify-start gap-2 rounded-xl px-3.5 py-2 text-left text-xs sm:text-sm font-medium transition-all duration-200 outline-none",
                        "max-lg:min-w-0 max-lg:flex-1 max-lg:flex-col max-lg:justify-center max-lg:gap-1 max-lg:px-1 max-lg:py-2 max-lg:text-center max-lg:text-[10px] max-lg:leading-tight",
                        "lg:w-full lg:gap-3.5 lg:px-4 lg:py-3.5",
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
                      <span className="z-10 whitespace-nowrap lg:hidden">{t(`tabs.${tab.id}Short`)}</span>
                      <span className="z-10 hidden whitespace-nowrap lg:inline">{t(`tabs.${tab.id}`)}</span>
                      {isActive && (
                        <motion.span
                          layoutId="settings-active-indicator"
                          className="absolute inset-0 rounded-xl bg-muted shadow-sm"
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
                className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-6 lg:p-10"
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
                          title={t("profile.title")}
                          description={t("profile.description")}
                          icon={UserRound}
                        />
                        <Separator />
                        <form
                          onSubmit={handleSubmit(handleSaveProfile)}
                          className="flex flex-col gap-6"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              <Avatar className="size-14 shrink-0 border">
                                <AvatarImage
                                  src={avatarUrl ?? user?.image ?? undefined}
                                  alt={name}
                                />
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex min-w-0 flex-col gap-1">
                                <h6 className="flex min-w-0 items-center gap-2 text-sm font-medium">
                                  <span className="truncate">{name}</span>{" "}
                                  <Badge
                                    variant="secondary"
                                    className="w-fit shrink-0 text-xs capitalize"
                                  >
                                    {role}
                                  </Badge>
                                </h6>
                                <p className="max-w-5xl truncate text-xs sm:text-sm text-muted-foreground">
                                  {email}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full cursor-pointer sm:ml-auto sm:w-auto"
                              onClick={() => setIsAvatarDialogOpen(true)}
                            >
                              {t("profile.changePhoto")}
                            </Button>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label
                                htmlFor="name"
                                className="text-sm text-muted-foreground"
                              >
                                {t("profile.fullName")}
                              </Label>
                              <Input
                                id="name"
                                autoComplete="name"
                                className="h-12"
                                aria-invalid={!!errors.name}
                                {...register("name")}
                              />
                              {errors.name && (
                                <p className="max-w-5xl text-xs sm:text-sm text-destructive">
                                  {errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="email"
                                className="text-sm text-muted-foreground"
                              >
                                {t("profile.email")}
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                disabled
                                value={email}
                                readOnly
                                className="h-12 cursor-not-allowed bg-muted/20 opacity-60"
                              />
                              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                {t("profile.emailHint")}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label
                                htmlFor="phone"
                                className="text-sm text-muted-foreground"
                              >
                                {t("profile.phone")}
                              </Label>
                              <PhoneInput
                                id="phone"
                                value={watch("phone") ?? ""}
                                onChange={(e) =>
                                  setValue("phone", e.target.value, {
                                    shouldValidate: true,
                                  })
                                }
                                defaultCountry={resolveCountryAlpha2(
                                  watch("country")
                                )}
                                onCountryChange={(country) => {
                                  if (country) {
                                    setValue("country", country.alpha3, {
                                      shouldValidate: true,
                                    })
                                  }
                                }}
                                placeholder={t("profile.phonePlaceholder")}
                                className="h-12 w-full"
                                aria-invalid={!!errors.phone}
                              />
                              {errors.phone && (
                                <p className="max-w-5xl text-xs sm:text-sm text-destructive">
                                  {errors.phone.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="country"
                                className="text-sm text-muted-foreground"
                              >
                                {t("profile.country")}
                              </Label>
                              <CountryDropdown
                                defaultValue={resolveCountryAlpha3(
                                  watch("country")
                                )}
                                onChange={(country) =>
                                  setValue("country", country.alpha3, {
                                    shouldValidate: true,
                                  })
                                }
                                className="h-12 w-full"
                                placeholder={t("profile.countryPlaceholder")}
                              />
                              {errors.country && (
                                <p className="max-w-5xl text-xs sm:text-sm text-destructive">
                                  {errors.country.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">
                                {t("profile.sex")}
                              </Label>
                              <Select
                                value={watch("sex")}
                                onValueChange={(v) =>
                                  setValue("sex", v as "male" | "female", {
                                    shouldValidate: true,
                                  })
                                }
                              >
                                <SelectTrigger
                                  className="h-12 w-full data-[size=default]:h-12"
                                  aria-invalid={!!errors.sex}
                                >
                                  <SelectValue placeholder={t("profile.selectOption")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">{t("profile.male")}</SelectItem>
                                  <SelectItem value="female">{t("profile.female")}</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.sex && (
                                <p className="max-w-5xl text-xs sm:text-sm text-destructive">
                                  {errors.sex.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">
                                {t("profile.ageRange")}
                              </Label>
                              <Select
                                value={watch("ageRange")}
                                onValueChange={(v) =>
                                  setValue(
                                    "ageRange",
                                    v as ProfileForm["ageRange"],
                                    { shouldValidate: true }
                                  )
                                }
                              >
                                <SelectTrigger
                                  className="h-12 w-full data-[size=default]:h-12"
                                  aria-invalid={!!errors.ageRange}
                                >
                                  <SelectValue placeholder={t("profile.ageRangePlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {AGE_RANGES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r.replace("-", "\u2013")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.ageRange && (
                                <p className="max-w-5xl text-xs sm:text-sm text-destructive">
                                  {errors.ageRange.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="timezone"
                                className="text-sm text-muted-foreground"
                              >
                                {t("profile.timezone")}
                              </Label>
                              <Popover
                                open={tzOpen}
                                onOpenChange={(open) => {
                                  setTzOpen(open)
                                  if (open) setTzFilter("")
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    id="timezone"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={tzOpen}
                                    aria-invalid={!!errors.timezone}
                                    className={cn(
                                      "h-12 w-full justify-between text-left font-normal",
                                      !watch("timezone") && "text-muted-foreground",
                                    )}
                                  >
                                    {watch("timezone")
                                      ? TIMEZONE_OPTIONS.find((tz) => tz.value === watch("timezone"))?.label ?? watch("timezone")
                                      : t("profile.timezonePlaceholder")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                                  <Command>
                                    <CommandInput
                                      placeholder={t("profile.timezonePlaceholder")}
                                      value={tzFilter}
                                      onValueChange={setTzFilter}
                                      className="h-9"
                                    />
                                    <CommandList>
                                      <CommandEmpty>{t("profile.timezoneNoResults")}</CommandEmpty>
                                      {TIMEZONE_OPTIONS.filter((tz) =>
                                        tz.label.toLowerCase().includes(tzFilter.toLowerCase()),
                                      ).map((tz) => (
                                        <CommandItem
                                          key={tz.value}
                                          value={tz.value}
                                          onSelect={(val) => {
                                            setValue("timezone", val, { shouldValidate: true })
                                            setTzOpen(false)
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 size-4",
                                              watch("timezone") === tz.value ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {tz.label}
                                        </CommandItem>
                                      ))}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                {t("profile.timezoneHint")}
                              </p>
                              {errors.timezone && (
                                <p className="max-w-5xl text-xs sm:text-sm text-destructive">
                                  {errors.timezone.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="cursor-pointer"
                            >
                              {isSubmitting ? t("profile.saving") : t("profile.save")}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {activeTab === "notifications" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title={t("notifications.title")}
                          description={t("notifications.description")}
                          icon={Bell}
                        />
                        <Separator />
                        <div className="flex flex-col gap-5">
                          <div>
                            <h6 className={cn("mb-3", sectionLabelClass)}>
                              {t("notifications.email")}
                            </h6>
                            <div className="flex flex-col gap-5">
                              <ToggleRow
                                id="email-new-message"
                                icon={Mail}
                                title={t("notifications.newMessages")}
                                description={t("notifications.newMessagesEmail")}
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
                                title={t("notifications.prayerUpdates")}
                                description={t("notifications.prayerUpdatesEmail")}
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
                                title={t("notifications.broadcasts")}
                                description={t("notifications.broadcastsDesc")}
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
                          <PushSubscriptionManager />
                          <Separator />
                          <div>
                            <h6 className={cn("mb-3", sectionLabelClass)}>
                              {t("notifications.browserPush")}
                            </h6>
                            <div className="flex flex-col gap-5">
                              <ToggleRow
                                id="push-new-message"
                                icon={Smartphone}
                                title={t("notifications.newMessages")}
                                description={t("notifications.pushNewMessagesDesc")}
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
                                title={t("notifications.prayerUpdates")}
                                description={t("notifications.pushPrayerDesc")}
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
                            {isPendingNotifs ? t("notifications.saving") : t("notifications.save")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeTab === "appearance" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title={t("appearance.title")}
                          description={t("appearance.description")}
                          icon={Palette}
                        />
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            {t("appearance.theme")}
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {themeOptions.map((option) => {
                              const Icon = option.icon
                              const isActive = (theme ?? "system") === option.id
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => setTheme(option.id)}
                                  aria-pressed={isActive}
                                  className={cn(
                                    "group relative flex cursor-pointer flex-col rounded-lg border p-2 sm:p-3 text-left transition-all hover:bg-muted/50",
                                    isActive
                                      ? "border-foreground ring-1 ring-foreground"
                                      : "border-border"
                                  )}
                                >
                                  {isActive && (
                                    <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                                      <Check
                                        className="size-3"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                                  <ThemePreview variant={option.id} />
                                  <div className="flex items-center gap-2">
                                    <Icon
                                      className="size-3.5 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                    <span className="text-sm font-medium">
                                      {t(option.labelKey)}
                                    </span>
                                    {option.id === "system" && (
                                      <Badge
                                        variant="secondary"
                                        className="h-4 px-1.5 text-[10px]"
                                      >
                                        {t("appearance.auto")}
                                      </Badge>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <Separator />
                        <LanguageSection />
                      </div>
                    )}

                    {activeTab === "security" && (
                      <div className="flex flex-col gap-6">
                        <SectionHeader
                          title={t("security.title")}
                          description={t("security.description")}
                          icon={ShieldCheck}
                        />
                        <Separator />

                        {/* Two factor card */}
                        <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-2 sm:p-5 shadow-xs">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                              <Shield className="size-4" aria-hidden="true" />
                            </span>
                            <div className="space-y-0.5">
                              <h6 className="text-sm font-medium">
                                {t("security.tfa")}
                              </h6>
                              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                {t("security.tfaDesc")}
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
                              {twoFactorEnabled ? t("security.active") : t("security.off")}
                            </Badge>
                            {twoFactorEnabled ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRegenerateBackupCodes}
                                >
                                  {t("security.codes")}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setTwoFactorPassword("")
                                    setIsDisableModalOpen(true)
                                  }}
                                >
                                  {t("security.disable")}
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
                                {t("security.enable")}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Password form — Set or Change */}
                        {hasPassword ? (
                          <form
                            onSubmit={handleSubmitPw(handleChangePassword)}
                            className="flex flex-col gap-5"
                          >
                            <div className="space-y-2">
                              <Label
                                htmlFor="current-password"
                                className="text-sm text-muted-foreground"
                              >
                                {t("security.currentPassword")}
                              </Label>
                              <Input
                                id="current-password"
                                type="password"
                                autoComplete="current-password"
                                className="h-12"
                                aria-invalid={!!pwErrors.currentPassword}
                                {...registerPw("currentPassword")}
                              />
                              {pwErrors.currentPassword && (
                                <p className="max-w-5xl text-xs sm:text-sm text-destructive">
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
                                  {t("security.newPassword")}
                                </Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  autoComplete="new-password"
                                  className="h-12"
                                  aria-invalid={!!pwErrors.newPassword}
                                  {...registerPw("newPassword")}
                                />
                                {pwErrors.newPassword && (
                                  <p className="max-w-5xl text-xs sm:text-sm text-destructive">
                                    {pwErrors.newPassword.message}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="confirm-password"
                                  className="text-sm text-muted-foreground"
                                >
                                  {t("security.confirmPassword")}
                                </Label>
                                <Input
                                  id="confirm-password"
                                  type="password"
                                  autoComplete="new-password"
                                  className="h-12"
                                  aria-invalid={!!pwErrors.confirmPassword}
                                  {...registerPw("confirmPassword")}
                                />
                                {pwErrors.confirmPassword && (
                                  <p className="max-w-5xl text-xs sm:text-sm text-destructive">
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
                                  ? t("security.updating")
                                  : t("security.updatePassword")}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-5">
                            <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-2 sm:p-4">
                              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                {t("security.setPasswordHint")}
                              </p>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="set-new-password"
                                  className="text-sm text-muted-foreground"
                                >
                                  {t("security.newPassword")}
                                </Label>
                                <Input
                                  id="set-new-password"
                                  type="password"
                                  autoComplete="new-password"
                                  className="h-12"
                                  value={newPassword}
                                  onChange={(e) =>
                                    setNewPassword(e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="set-confirm-password"
                                  className="text-sm text-muted-foreground"
                                >
                                  {t("security.confirmPassword")}
                                </Label>
                                <Input
                                  id="set-confirm-password"
                                  type="password"
                                  autoComplete="new-password"
                                  className="h-12"
                                  value={confirmNewPassword}
                                  onChange={(e) =>
                                    setConfirmNewPassword(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isSettingPassword}
                                className="cursor-pointer"
                                onClick={handleSetPassword}
                              >
                                {isSettingPassword
                                  ? t("security.setting")
                                  : t("security.setPassword")}
                              </Button>
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Sessions list */}
                        <div className="space-y-4">
                          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-sm">{t("security.sessions")}</h4>
                              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                {t("security.sessionsDesc")}
                              </p>
                            </div>
                            {userSessions.length > 1 && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full text-xs sm:w-auto"
                                  >
                                    {t("security.logoutOthers")}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        {t("security.logoutTitle")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                    {t("security.logoutDesc")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel
                                      className={cn(
                                        buttonVariants({
                                          variant: "outline",
                                        }),
                                        "cursor-pointer",
                                      )}
                                    >
                                      {t("security.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleRevokeOtherSessions}
                                      className={cn(
                                        buttonVariants({
                                          variant: "destructive",
                                        }),
                                        "cursor-pointer",
                                      )}
                                    >
                                      {t("security.confirm")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>

                          <div className="flex flex-col gap-3">
                            {isSessionsLoading ? (
                              <div className="space-y-2 py-2 sm:py-4">
                                <div className="h-10 w-full animate-pulse rounded-lg bg-muted/60" />
                                <div className="h-10 w-full animate-pulse rounded-lg bg-muted/60" />
                              </div>
                            ) : userSessions.length === 0 ? (
                              <p className="max-w-5xl py-2 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                                {t("security.noSessions")}
                              </p>
                            ) : (
                              userSessions.map((sessionItem) => {
                                const { device, browser } = parseUA(
                                  sessionItem.userAgent ?? undefined,
                                  t
                                )
                                const isCurrent =
                                  sessionItem.id === currentSessionId
                                return (
                                  <div
                                    key={sessionItem.id}
                                    className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/10 p-2 sm:p-4 text-xs"
                                  >
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
                                        <Laptop className="size-4 text-muted-foreground" />
                                      </span>
                                      <div className="min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                                          <span>
                                            {device} • {browser}
                                          </span>
                                          {isCurrent && (
                                            <Badge className="h-4 border-none bg-primary/10 px-1 py-0 text-xs text-primary">
                                              {t("security.current")}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="max-w-5xl text-xs sm:text-sm break-all text-muted-foreground">
                                          IP:{" "}
                                          {sessionItem.ipAddress ||
                                            t("security.unknownIp")}{" "}
                                          • {t("security.activeLabel")}:{" "}
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
                                            className="h-7 shrink-0 text-xs"
                                          >
                                            {t("security.revoke")}
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              {t("security.terminateTitle")}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              {t("security.terminateDesc")}
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel
                                              className={cn(
                                                buttonVariants({
                                                  variant: "outline",
                                                }),
                                                "cursor-pointer",
                                              )}
                                            >
                                              {t("security.cancel")}
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                handleRevokeSession(
                                                  sessionItem.token
                                                )
                                              }
                                              className={cn(
                                                buttonVariants({
                                                  variant: "destructive",
                                                }),
                                                "cursor-pointer",
                                              )}
                                            >
                                              {t("security.terminate")}
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
                          title={t("account.title")}
                          description={t("account.description")}
                          icon={CircleUserRound}
                        />
                        <Separator />
                        <div className="flex flex-col gap-5">
                          {/* iCal card */}
                          <div className="flex flex-col gap-4 rounded-xl border p-2 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
                                <KeyRound
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <h6 className="text-sm font-medium">
                                  {t("account.ical")}
                                </h6>
                                <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                  {t("account.icalDesc")}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full cursor-pointer sm:w-auto"
                              onClick={() =>
                                toast.success(t("toast.calendarRegenerated"))
                              }
                            >
                              {t("account.regenerate")}
                            </Button>
                          </div>

                          {/* GDPR Data Export card */}
                          <div className="flex flex-col gap-4 rounded-xl border p-2 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
                                <Download
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <h6 className="text-sm font-medium">
                                  {t("account.export")}
                                </h6>
                                <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                  {t("account.exportDesc")}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full cursor-pointer sm:w-auto"
                                onClick={handleRequestEmailExport}
                                disabled={isExporting}
                              >
                                <Send className="mr-1 size-3.5" />
                                {isExporting ? t("account.sending") : t("account.emailCopy")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full cursor-pointer sm:w-auto"
                                asChild
                              >
                                <a href="/api/v1/account/export" download>
                                  <Download className="mr-1 size-3.5" />
                                  {t("account.downloadJson")}
                                </a>
                              </Button>
                            </div>
                          </div>

                          {/* Sign out */}
                          <div className="rounded-xl border p-2 sm:p-5 shadow-xs">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
                                <XCircle
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <h6 className="text-sm font-medium">
                                  {t("account.signOut")}
                                </h6>
                                <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                  {t("account.signOutDesc")}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 cursor-pointer"
                              onClick={handleSignOut}
                            >
                              {t("account.signOut")}
                            </Button>
                          </div>

                          {/* Danger Zone / Deletion */}
                          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2 sm:p-5 shadow-xs">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-background">
                                <XCircle
                                  className="size-4 text-destructive"
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="space-y-0.5">
                                <h6 className="text-sm font-medium text-destructive">
                                  {t("account.delete")}
                                </h6>
                                <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                  {t("account.deleteDesc")}
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
                                  {t("account.deleteButton")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="sm:max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive">
                                    {t("account.deleteTitle")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("account.deleteDescLong")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <div className="space-y-4 py-2 text-xs">
                                  {hasPassword && (
                                    <div className="space-y-2">
                                      <Label htmlFor="delete-confirm-password">
                                        {t("account.confirmPassword")}
                                      </Label>
                                      <Input
                                        id="delete-confirm-password"
                                        type="password"
                                        value={deletePassword}
                                        placeholder={t("account.passwordPlaceholder")}
                                        className="h-12"
                                        onChange={(e) =>
                                          setDeleteAccountPassword(
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  )}
                                  {!hasPassword && (
                                    <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                                      {t("account.oauthNote")}
                                    </p>
                                  )}

                                  <div className="space-y-2">
                                    <Label htmlFor="delete-typed-confirm">
                                      {t("account.typeDeletePrefix")}{" "}
                                      <span className="font-bold text-foreground">
                                        DELETE
                                      </span>{" "}
                                      {t("account.typeDeleteSuffix")}
                                    </Label>
                                    <Input
                                      id="delete-typed-confirm"
                                      value={deleteConfirmation}
                                      placeholder={t("account.deletePlaceholder")}
                                      className="h-12"
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
                                    className={cn(
                                      buttonVariants({ variant: "outline" }),
                                      "cursor-pointer",
                                    )}
                                  >
                                    {t("account.cancel")}
                                  </AlertDialogCancel>
                                  <Button
                                    variant="destructive"
                                    disabled={
                                      isDeleting ||
                                      deleteConfirmation !== "DELETE" ||
                                      (hasPassword && !deletePassword)
                                    }
                                    onClick={handleDeleteAccount}
                                  >
                                    {isDeleting
                                      ? t("account.deleting")
                                      : t("account.deleteFinal")}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("tfa.enableTitle")}</DialogTitle>
            <DialogDescription>
              {t("tfa.enableDesc")}
            </DialogDescription>
          </DialogHeader>

          {twoFactorStep === "auth" && (
            <div className="space-y-4 py-2">
              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                {t("tfa.authHint")}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="two-factor-auth-pw">{t("tfa.currentPassword")}</Label>
                <Input
                  id="two-factor-auth-pw"
                  type="password"
                  value={twoFactorPassword}
                  placeholder={t("tfa.passwordPlaceholder")}
                  className="h-12"
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                />
              </div>
              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-2 sm:p-4">
                <Button
                  variant="outline"
                  onClick={() => setIs2FAModalOpen(false)}
                >
                  {t("tfa.cancel")}
                </Button>
                <Button
                  disabled={is2FALoading || !twoFactorPassword}
                  onClick={handleStart2FAEnable}
                >
                  {is2FALoading ? t("tfa.generating") : t("tfa.next")}
                </Button>
              </DialogFooter>
            </div>
          )}

          {twoFactorStep === "scan" && (
            <div className="space-y-4 py-2 text-center sm:text-left">
              <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:justify-start">
                {/* Render QR code from free instant zero-dependency QR code API */}
                {totpURI && (
                  <div className="shrink-0 rounded-2xl border bg-white p-2 sm:p-3 shadow-sm">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(totpURI)}`}
                      alt={t("tfa.qrAlt")}
                      width={150}
                      height={150}
                      unoptimized
                      className="block"
                    />
                  </div>
                )}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="max-w-5xl text-xs sm:text-sm font-semibold text-foreground">
                    {t("tfa.scanTitle")}
                  </p>
                  <p className="max-w-5xl text-xs sm:text-sm">
                    {t("tfa.scanDesc")}
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
                          toast.success(t("toast.secretCopied"))
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
                  {t("tfa.codeLabel")}
                </Label>
                <Input
                  id="two-factor-code-input"
                  value={twoFactorCode}
                  placeholder={t("tfa.codePlaceholder")}
                  maxLength={6}
                  className="h-12"
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
              </div>

              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-2 sm:p-4">
                <Button
                  variant="outline"
                  onClick={() => setTwoFactorStep("auth")}
                >
                  {t("tfa.back")}
                </Button>
                <Button
                  disabled={is2FALoading || twoFactorCode.length < 6}
                  onClick={handleVerify2FACode}
                >
                  {is2FALoading ? t("tfa.verifying") : t("tfa.verify")}
                </Button>
              </DialogFooter>
            </div>
          )}

          {twoFactorStep === "backup" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                <Check className="size-5 shrink-0" />
                <p className="max-w-5xl text-xs sm:text-sm font-semibold">
                  {t("tfa.enabledTitle")}
                </p>
              </div>
              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                {t("tfa.enabledDesc")}
              </p>

              <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-2 font-mono text-xs sm:p-3.5">
                {backupCodes.map((code, idx) => (
                  <div
                    key={code}
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
                    toast.success(t("toast.codesCopied"))
                  }}
                >
                  <Copy className="mr-1 size-3.5" />
                  {copiedBackup ? t("tfa.copied") : t("tfa.copyCodes")}
                </Button>
              </div>

              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-2 sm:p-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setIs2FAModalOpen(false)
                    setTwoFactorPassword("")
                    setTwoFactorCode("")
                  }}
                >
                  {t("tfa.saved")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("tfa.disableTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("tfa.disableDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="disable-two-factor-pw">{t("tfa.currentPassword")}</Label>
              <Input
                id="disable-two-factor-pw"
                type="password"
                value={twoFactorPassword}
                placeholder={t("tfa.disablePasswordPlaceholder")}
                className="h-12"
                onChange={(e) => setTwoFactorPassword(e.target.value)}
              />
            </div>
            <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-2 sm:p-4">
              <Button
                variant="outline"
                onClick={() => setIsDisableModalOpen(false)}
              >
                {t("tfa.cancel")}
              </Button>
              <Button
                variant="destructive"
                disabled={is2FALoading || !twoFactorPassword}
                onClick={handleDisable2FA}
              >
                {is2FALoading ? t("tfa.disabling") : t("tfa.disableCta")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Regenerate Backup Codes Dialog */}
      <Dialog open={isRegenModalOpen} onOpenChange={setIsRegenModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("tfa.regenTitle")}</DialogTitle>
            <DialogDescription>
              {t("tfa.regenDesc")}
            </DialogDescription>
          </DialogHeader>

          {regenStep === "auth" ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="regen-backup-pw">{t("tfa.currentPassword")}</Label>
                <Input
                  id="regen-backup-pw"
                  type="password"
                  value={regenPassword}
                  placeholder={t("tfa.disablePasswordPlaceholder")}
                  className="h-12"
                  onChange={(e) => setRegenPassword(e.target.value)}
                />
              </div>
              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-2 sm:p-4">
                <Button
                  variant="outline"
                  onClick={() => setIsRegenModalOpen(false)}
                >
                  {t("tfa.cancel")}
                </Button>
                <Button
                  disabled={isRegenerating || !regenPassword}
                  onClick={handleConfirmRegenerate}
                >
                  {isRegenerating ? t("tfa.generatingCodes") : t("tfa.generate")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                <Check className="size-5 shrink-0" />
                <p className="max-w-5xl text-xs sm:text-sm font-semibold">
                  {t("tfa.regenDone")}
                </p>
              </div>
              <p className="max-w-5xl text-xs sm:text-sm text-muted-foreground">
                {t("tfa.regenDoneDesc")}
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-2 font-mono text-xs sm:p-3.5">
                {backupCodes.map((code, idx) => (
                  <div
                    key={code}
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
              <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/40 p-2 sm:p-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setIsRegenModalOpen(false)
                    setRegenPassword("")
                  }}
                >
                  {t("tfa.done")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AvatarUploadDialog
        open={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        currentImage={avatarUrl ?? user?.image}
        userName={name}
        initials={initials}
        onAvatarUpdated={(newUrl) => {
          setAvatarUrl(newUrl)
          refetchSession?.({ query: { disableCookieCache: true } })
        }}
      />
    </div>
  )
}