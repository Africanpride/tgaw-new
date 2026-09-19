"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	AuthBrand,
	AuthShell,
	GoogleIcon,
	MicrosoftIcon,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type SignupForm = {
	name: string;
	email: string;
	password: string;
};

export default function SignUpPage() {
	const t = useTranslations("auth");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<SignupForm>({
		resolver: zodResolver(
			z.object({
				name: z.string().min(1, t("validation.nameRequired")),
				email: z.string().email(t("validation.invalidEmail")),
				password: z.string().min(8, t("validation.passwordMin")),
			})
		),
	});

	async function onSubmit(data: SignupForm) {
		setError(null);
		const result = await authClient.signUp.email({
			name: data.name,
			email: data.email,
			password: data.password,
		});
		if (result.error) {
			const msg = (result.error.message || "").toLowerCase();
			const code = (result.error as { code?: string }).code?.toLowerCase() ?? "";
			// Stop enumeration: "already exists" should not reveal — show generic success
			if (msg.includes("already exists") || msg.includes("already registered") || code.includes("user_already_exists")) {
				setSuccess(true);
				return;
			}
			// haveIBeenPwned: keep specific pwned message for UX
			setError(result.error.message || t("signup.signUpFailed"));
		} else {
			setSuccess(true);
		}
	}

	async function handleMicrosoft() {
		await authClient.signIn.social({
			provider: "microsoft",
			callbackURL: "/overview",
		});
	}

	async function handleGoogle() {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/overview",
		});
	}

	if (success) {
		return (
			<AuthShell>
				<AuthBrand />
				<h1 className="text-2xl text-card-foreground sm:text-3xl">
					{t("signup.checkEmailTitle")}
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					{t("signup.checkEmailBody")}
				</p>
				<div className="mt-8">
					<Link
						href="/login"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						{t("signup.backToLogin")}
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			<AuthBrand />

			<h1 className="text-2xl text-card-foreground sm:text-3xl">
				{t("signup.beginWatch")}
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("signup.hasAccount")}{" "}
				<Link
					href="/login"
					className="cursor-pointer font-medium text-primary hover:text-primary/80"
				>
					{t("signup.signIn")}
				</Link>
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
				{error && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				)}
				<div className="space-y-2">
					<Label htmlFor="name" className="text-sm text-muted-foreground">
						{t("signup.name")}<span className="text-muted-foreground/60">*</span>
					</Label>
					<Input
						id="name"
						autoComplete="name"
						placeholder={t("signup.namePlaceholder")}
						required
						className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
						{...register("name")}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email" className="text-sm text-muted-foreground">
						{t("signup.email")}<span className="text-muted-foreground/60">*</span>
					</Label>
					<Input
						id="email"
						type="email"
						inputMode="email"
						autoComplete="email"
						placeholder={t("login.emailPlaceholder")}
						required
						className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
						{...register("email")}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="password" className="text-sm text-muted-foreground">
						{t("signup.password")}<span className="text-muted-foreground/60">*</span>
					</Label>
					<Input
						id="password"
						type="password"
						autoComplete="new-password"
						placeholder={t("signup.passwordPlaceholder")}
						required
						className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
						{...register("password")}
					/>
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					className="h-11 w-full cursor-pointer rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{isSubmitting ? t("signup.submitBusy") : t("signup.submit")}
				</Button>
			</form>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				{t("signup.orContinueWith")}
			</p>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<Button
					variant="outline"
					type="button"
					onClick={handleGoogle}
					className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
				>
					<GoogleIcon />
					{t("signup.google")}
				</Button>
				<Button
					variant="outline"
					type="button"
					onClick={handleMicrosoft}
					className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
				>
					<MicrosoftIcon />
					{t("signup.microsoft")}
				</Button>
			</div>
		</AuthShell>
	);
}