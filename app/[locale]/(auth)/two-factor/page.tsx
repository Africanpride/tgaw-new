"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthBrand, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function TwoFactorPage() {
	const t = useTranslations("auth");
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	async function handleVerify() {
		if (code.length !== 6) return;
		setError(null);
		startTransition(async () => {
			const result = await authClient.twoFactor.verifyTotp({ code });
			if (result.error) {
				setError(result.error.message || t("twoFactor.invalidCode"));
			} else {
				router.push("/");
			}
		});
	}

	return (
		<AuthShell>
			<AuthBrand />

			<h1 className="text-2xl text-card-foreground sm:text-3xl">
				{t("twoFactor.title")}
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("twoFactor.subtitle")}
			</p>

			<form
				className="mt-8 space-y-5"
				onSubmit={(e) => {
					e.preventDefault();
					handleVerify();
				}}
			>
				{error && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				)}
				<div className="space-y-2">
					<Label htmlFor="code" className="text-sm text-muted-foreground">
						{t("twoFactor.code")}<span className="text-muted-foreground/60">*</span>
					</Label>
					<Input
						id="code"
						value={code}
						onChange={(e) =>
							setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
						}
						maxLength={6}
						placeholder="000000"
						required
						className="h-11 border-input bg-background text-center text-lg tracking-widest text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
					/>
				</div>

				<Button
					type="submit"
					disabled={code.length !== 6 || isPending}
					className="h-11 w-full cursor-pointer rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{isPending ? t("twoFactor.verifying") : t("twoFactor.submit")}
				</Button>
			</form>
		</AuthShell>
	);
}