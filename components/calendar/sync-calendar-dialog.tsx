"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, Copy, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	ensureCalendarFeedToken,
	regenerateCalendarFeedToken,
} from "@/actions/calendarFeedActions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants, Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SyncCalendarDialog() {
	const { t } = useTranslation("calendar");
	const { t: tc } = useTranslation("common");
	const [open, setOpen] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [webcal, setWebcal] = useState(false);
	const [copied, setCopied] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [regenerating, setRegenerating] = useState(false);

	useEffect(() => {
		if (!open || token) return;
		let cancelled = false;
		async function run() {
			setLoading(true);
			try {
				const next = await ensureCalendarFeedToken();
				if (!cancelled) setToken(next);
			} catch (error) {
				console.error("[ERROR] Calendar feed token load failed:", error);
				if (!cancelled) toast.error(t("sync.loadFailed"));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		void run();
		return () => {
			cancelled = true;
		};
	}, [open, token, t]);

	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const httpsUrl = token
		? `${origin}/api/v1/calendar/ical?token=${token}`
		: "";
	const url = webcal ? httpsUrl.replace(/^https:/, "webcal:") : httpsUrl;

	const handleCopy = async () => {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success(t("sync.copied"));
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error(t("sync.copyFailed"));
		}
	};

	const handleRegenerate = async () => {
		setRegenerating(true);
		try {
			const next = await regenerateCalendarFeedToken();
			setToken(next);
			toast.success(t("sync.regenerated"));
		} catch {
			toast.error(t("sync.loadFailed"));
		} finally {
			setRegenerating(false);
			setConfirmOpen(false);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="cursor-pointer shrink-0"
					>
						<Calendar className="size-4" aria-hidden="true" />
						{t("sync.button")}
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("sync.title")}</DialogTitle>
						<DialogDescription>{t("sync.description")}</DialogDescription>
					</DialogHeader>

					{loading || !token ? (
						<div className="flex flex-col gap-2" aria-busy="true">
							<Skeleton className="h-4 w-1/3" />
							<Skeleton className="h-9 w-full" />
						</div>
					) : (
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="calendar-feed-url">
									{t("sync.urlLabel")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										id="calendar-feed-url"
										readOnly
										value={url}
										className="min-w-0 flex-1 font-mono text-xs"
										onFocus={(event) => event.target.select()}
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="cursor-pointer"
										aria-label={t("sync.scheme")}
										onClick={() => setWebcal((value) => !value)}
									>
										{webcal ? "webcal://" : "https://"}
									</Button>
									<Button
										type="button"
										size="sm"
										className="cursor-pointer"
										onClick={handleCopy}
										aria-label={t("sync.copy")}
									>
										{copied ? (
											<Check className="size-3.5" aria-hidden="true" />
										) : (
											<Copy className="size-3.5" aria-hidden="true" />
										)}
										{copied ? t("sync.copied") : t("sync.copy")}
									</Button>
								</div>
							</div>

							<Separator />

							<Tabs defaultValue="google" className="w-full">
								<TabsList className="w-full">
									<TabsTrigger value="google">{t("sync.tabGoogle")}</TabsTrigger>
									<TabsTrigger value="apple">{t("sync.tabApple")}</TabsTrigger>
									<TabsTrigger value="outlook">
										{t("sync.tabOutlook")}
									</TabsTrigger>
								</TabsList>
								<TabsContent
									value="google"
									className="flex flex-col gap-2 text-sm text-muted-foreground"
								>
									<p>{t("sync.google.desc")}</p>
									<ol className="list-decimal space-y-1 pl-5">
										<li>{t("sync.google.step1")}</li>
										<li>{t("sync.google.step2")}</li>
										<li>{t("sync.google.step3")}</li>
									</ol>
								</TabsContent>
								<TabsContent
									value="apple"
									className="flex flex-col gap-2 text-sm text-muted-foreground"
								>
									<p>{t("sync.apple.desc")}</p>
									<ol className="list-decimal space-y-1 pl-5">
										<li>{t("sync.apple.step1")}</li>
										<li>{t("sync.apple.step2")}</li>
										<li>{t("sync.apple.step3")}</li>
									</ol>
								</TabsContent>
								<TabsContent
									value="outlook"
									className="flex flex-col gap-2 text-sm text-muted-foreground"
								>
									<p>{t("sync.outlook.desc")}</p>
									<ol className="list-decimal space-y-1 pl-5">
										<li>{t("sync.outlook.step1")}</li>
										<li>{t("sync.outlook.step2")}</li>
										<li>{t("sync.outlook.step3")}</li>
									</ol>
								</TabsContent>
							</Tabs>

							<p className="text-xs text-muted-foreground">{t("sync.note")}</p>

							<div className="flex justify-end">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="cursor-pointer text-destructive hover:text-destructive"
									onClick={() => setConfirmOpen(true)}
								>
									<RefreshCw className="size-3.5" aria-hidden="true" />
									{t("sync.regenerate")}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("sync.regenerateTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("sync.regenerateDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("action.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className={buttonVariants({ variant: "destructive" })}
							disabled={regenerating}
							onClick={(event) => {
								event.preventDefault();
								void handleRegenerate();
							}}
						>
							{t("sync.regenerateConfirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
