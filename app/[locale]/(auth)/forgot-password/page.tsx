"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthBrand, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Form = {
	email: string;
};

export default function ForgotPasswordPage() {
	const t = useTranslations("auth");
	const [sent, setSent] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<Form>({
		resolver: zodResolver(
			z.object({
				email: z.string().email(t("validation.invalidEmail")),
			})
		),
	});

	async function onSubmit(data: Form) {
		await authClient.requestPasswordReset({
			email: data.email,
			redirectTo: "/reset-password",
		});
		setSent(true);
	}

	if (sent) {
		return (
			<AuthShell>
				<AuthBrand />
				<h1 className="text-2xl text-card-foreground sm:text-3xl">
					{t("forgotPassword.checkEmail")}
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					{t("forgotPassword.sentMessage")}
				</p>
				<div className="mt-8">
					<Link
						href="/login"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						{t("forgotPassword.backToLogin")}
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			<AuthBrand />

			<h1 className="text-2xl text-card-foreground sm:text-3xl">
				{t("forgotPassword.title")}
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("forgot.subtitle")}
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
				<div className="space-y-2">
					<Label htmlFor="email" className="text-sm text-muted-foreground">
						{t("login.email")}<span className="text-muted-foreground/60">*</span>
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

				<Button
					type="submit"
					disabled={isSubmitting}
					className="h-11 w-full cursor-pointer rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{isSubmitting ? t("forgotPassword.sending") : t("forgotPassword.sendLink")}
				</Button>
			</form>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				<Link
					href="/login"
					className="cursor-pointer font-medium text-primary hover:text-primary/80"
				>
					{t("forgotPassword.backToLogin")}
				</Link>
			</p>
		</AuthShell>
	);
}