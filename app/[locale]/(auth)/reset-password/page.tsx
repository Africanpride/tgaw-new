"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthBrand, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Form = {
	password: string;
};

function ResetPasswordForm() {
	const t = useTranslations("auth");
	const searchParams = useSearchParams();
	const token = searchParams.get("token") ?? undefined;
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<Form>({
		resolver: zodResolver(
			z.object({
				password: z.string().min(8, t("validation.passwordMin")),
			})
		),
	});

	if (!token) {
		return (
			<AuthShell>
				<AuthBrand />
				<h1 className="text-2xl text-card-foreground sm:text-3xl">
					{t("resetPassword.invalidTitle")}
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					{t("resetPassword.invalidBody")}
				</p>
				<div className="mt-8">
					<Link
						href="/forgot-password"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						{t("resetPassword.requestNew")}
					</Link>
				</div>
			</AuthShell>
		);
	}

	async function onSubmit(data: Form) {
		setError(null);
		const result = await authClient.resetPassword({
			newPassword: data.password,
			token,
		});
		if (result.error) {
			setError(result.error.message || t("resetPassword.resetFailed"));
		} else {
			setSuccess(true);
		}
	}

	if (success) {
		return (
			<AuthShell>
				<AuthBrand />
				<h1 className="text-2xl text-card-foreground sm:text-3xl">
					{t("resetPassword.successTitle")}
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					{t("resetPassword.successBody")}
				</p>
				<div className="mt-8">
					<Link
						href="/login"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						{t("signup.signIn")}
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			<AuthBrand />

			<h1 className="text-2xl text-card-foreground sm:text-3xl">
				{t("resetPassword.title")}
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("resetPassword.subtitle")}
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
				{error && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				)}
				<div className="space-y-2">
					<Label htmlFor="password" className="text-sm text-muted-foreground">
						{t("resetPassword.newPassword")}<span className="text-muted-foreground/60">*</span>
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
					{isSubmitting ? t("resetPassword.resetting") : t("resetPassword.submit")}
				</Button>
			</form>
		</AuthShell>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}