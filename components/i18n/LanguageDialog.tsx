"use client";

import { Check, Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { startTransition, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { changeLanguage } from "@/i18n/client";
import {
	DEFAULT_LOCALE,
	LOCALES,
	LOCALE_COOKIE_NAME,
	LOCALE_FLAGS,
	LOCALE_NAMES,
	isLocale,
	type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

const DIALOG_STRINGS: Record<Locale, { title: string; desc: string }> = {
	en: {
		title: "Change language",
		desc: "Choose your preferred language. Your choice is saved to your account and this device.",
	},
	fr: {
		title: "Changer de langue",
		desc: "Choisissez votre langue préférée. Votre choix est enregistré sur votre compte et cet appareil.",
	},
	es: {
		title: "Cambiar idioma",
		desc: "Elige tu idioma preferido. Tu elección se guarda en tu cuenta y en este dispositivo.",
	},
	pt: {
		title: "Mudar idioma",
		desc: "Escolha seu idioma preferido. Sua escolha é salva na sua conta e neste dispositivo.",
	},
};

const DASHBOARD_PATHS = [
	"/overview",
	"/bible",
	"/prayer",
	"/calendar",
	"/messages",
	"/worship",
	"/groups",
	"/settings",
	"/admin",
	"/coordinator",
	"/board",
	"/feed",
	"/notifications",
	"/booking",
	"/onboarding",
];

interface LanguageDialogProps {
	className?: string;
	trigger?: React.ReactNode;
	label?: string;
}

/**
 * Universal language dialog — opens a sleek modal to switch language.
 * Works seamlessly across both the public home page (with next-intl URL prefixing)
 * and the dashboard (cookie-based Next.js Server Components refresh).
 */
export function LanguageDialog({
	className,
	trigger,
	label,
}: LanguageDialogProps = {}) {
	const router = useRouter();
	const pathname = usePathname() || "/";
	const { t, i18n } = useTranslation("dashboard");
	const [open, setOpen] = useState(false);

	const prefixMatch = pathname.match(/^\/(en|fr|es|pt)(?=\/|$)/);
	const cookieMatch =
		typeof document !== "undefined"
			? document.cookie.match(
					new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`),
				)
			: null;
	const cookieLocale = cookieMatch?.[1];

	const current: Locale = prefixMatch
		? (prefixMatch[1] as Locale)
		: isLocale(cookieLocale)
			? (cookieLocale as Locale)
			: isLocale(i18n.language)
				? (i18n.language as Locale)
				: DEFAULT_LOCALE;

	const activeCountryCode = LOCALE_FLAGS[current] ?? "gb";

	const titleText = t("topbar.changeLanguage", {
		defaultValue: DIALOG_STRINGS[current]?.title ?? DIALOG_STRINGS.en.title,
	});
	const descText = t("topbar.languageDescription", {
		defaultValue: DIALOG_STRINGS[current]?.desc ?? DIALOG_STRINGS.en.desc,
	});

	function switchLocale(newLocale: Locale) {
		setOpen(false);
		if (newLocale === current) return;

		// 1. Immediately update client cookie so subsequent requests carry the new locale
		document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; samesite=lax`;

		// 2. Persist to DB in background (if authenticated)
		void fetch("/api/v1/locale", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ locale: newLocale }),
		}).catch(() => {});

		// 3. Update client in-memory translations and refresh/route seamlessly
		const isDashboardRoute = DASHBOARD_PATHS.some(
			(root) => pathname === root || pathname.startsWith(`${root}/`),
		);

		startTransition(async () => {
			try {
				await changeLanguage(newLocale);
			} catch (err) {
				console.error("Failed to change language:", err);
			}

			if (isDashboardRoute) {
				router.refresh();
			} else {
				// Public route: calculate new path according to next-intl "as-needed" prefix
				const barePath =
					pathname.replace(/^\/(en|fr|es|pt)(?=\/|$)/, "") || "/";
				const targetPath =
					newLocale === DEFAULT_LOCALE
						? barePath
						: barePath === "/"
							? `/${newLocale}`
							: `/${newLocale}${barePath}`;

				if (targetPath !== pathname) {
					router.push(targetPath);
				}
				router.refresh();
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? (
					label ? (
						<Button
							variant="ghost"
							className={cn(
								"w-full cursor-pointer justify-start gap-2.5",
								className,
							)}
							aria-label={titleText}
						>
							<span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/40 ring-1 ring-border/60 shadow-xs">
								<CircleFlag
									countryCode={activeCountryCode}
									height={20}
									width={20}
									className="size-5 rounded-full object-cover"
									aria-hidden="true"
								/>
							</span>
							<span className="text-sm font-medium">{label}</span>
						</Button>
					) : (
						<Button
							variant="ghost"
							size="icon"
							className={cn("cursor-pointer", className)}
							aria-label={titleText}
						>
							<span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/40 ring-1 ring-border/60 shadow-xs">
								<CircleFlag
									countryCode={activeCountryCode}
									height={20}
									width={20}
									className="size-5 rounded-full object-cover"
									aria-hidden="true"
								/>
							</span>
						</Button>
					)
				)}
			</DialogTrigger>
			<DialogContent className="max-w-[320px] sm:max-w-[320px] p-4 gap-3 rounded-2xl border-border/60 shadow-xl max-sm:top-1/2 max-sm:-translate-y-1/2">
				<DialogHeader className="gap-1 pr-6 text-left">
					<DialogTitle className="text-sm font-semibold tracking-tight">
						{titleText}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-normal">
						{descText}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-1 pt-1">
					{LOCALES.map((loc) => {
						const isActive = loc === current;
						return (
							<Button
								key={loc}
								variant="ghost"
								className={cn(
									"h-10 w-full cursor-pointer justify-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
									isActive
										? "bg-accent font-semibold text-accent-foreground"
										: "font-normal text-muted-foreground hover:bg-accent/60 hover:text-foreground",
								)}
								aria-current={isActive ? "true" : undefined}
								onClick={() => switchLocale(loc)}
							>
								<span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/40 ring-1 ring-border/50">
									<CircleFlag
										countryCode={LOCALE_FLAGS[loc]}
										height={18}
										width={18}
										className="size-5 rounded-full object-cover"
										aria-hidden="true"
									/>
								</span>
								<span className="flex-1 text-left text-xs">
									{LOCALE_NAMES[loc]}
								</span>
								{isActive && (
									<Check className="size-3.5 text-primary shrink-0" aria-hidden="true" />
								)}
							</Button>
						);
					})}
				</div>
			</DialogContent>
		</Dialog>
	);
}
