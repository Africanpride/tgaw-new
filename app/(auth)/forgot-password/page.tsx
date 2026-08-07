"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthBrand, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
	email: z.string().email("Invalid email"),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<Form>({
		resolver: zodResolver(schema),
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
				<h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">
					Check your email
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					If that email exists, a reset link was sent.
				</p>
				<div className="mt-8">
					<Link
						href="/login"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						Back to login
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			<AuthBrand />

			<h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">
				Forgot password
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Enter your email and we&apos;ll send you a reset link.
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
				<div className="space-y-2">
					<Label htmlFor="email" className="text-sm text-muted-foreground">
						Email<span className="text-muted-foreground/60">*</span>
					</Label>
					<Input
						id="email"
						type="email"
						inputMode="email"
						autoComplete="email"
						placeholder="you@example.com"
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
					{isSubmitting ? "Sending..." : "Send reset link"}
				</Button>
			</form>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				<Link
					href="/login"
					className="cursor-pointer font-medium text-primary hover:text-primary/80"
				>
					Back to login
				</Link>
			</p>
		</AuthShell>
	);
}
