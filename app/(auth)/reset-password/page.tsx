"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

const schema = z.object({
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type Form = z.infer<typeof schema>;

function ResetPasswordForm() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token") ?? undefined;
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<Form>({
		resolver: zodResolver(schema),
	});

	if (!token) {
		return (
			<AuthShell>
				<AuthBrand />
				<h1 className="text-2xl text-card-foreground sm:text-3xl">
					Invalid link
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					This password reset link is invalid or has expired.
				</p>
				<div className="mt-8">
					<Link
						href="/forgot-password"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						Request a new link
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
			setError(result.error.message || "Reset failed");
		} else {
			setSuccess(true);
		}
	}

	if (success) {
		return (
			<AuthShell>
				<AuthBrand />
				<h1 className="text-2xl text-card-foreground sm:text-3xl">
					Password reset
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Your password has been reset successfully.
				</p>
				<div className="mt-8">
					<Link
						href="/login"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						Sign in
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			<AuthBrand />

			<h1 className="text-2xl text-card-foreground sm:text-3xl">
				Reset password
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Enter your new password
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
				{error && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				)}
				<div className="space-y-2">
					<Label htmlFor="password" className="text-sm text-muted-foreground">
						New password<span className="text-muted-foreground/60">*</span>
					</Label>
					<Input
						id="password"
						type="password"
						autoComplete="new-password"
						placeholder="At least 8 characters"
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
					{isSubmitting ? "Resetting..." : "Reset password"}
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
