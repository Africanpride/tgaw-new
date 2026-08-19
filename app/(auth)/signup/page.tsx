"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

const signupSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignUpPage() {
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<SignupForm>({
		resolver: zodResolver(signupSchema),
	});

	async function onSubmit(data: SignupForm) {
		setError(null);
		const result = await authClient.signUp.email({
			name: data.name,
			email: data.email,
			password: data.password,
		});
		if (result.error) {
			setError(result.error.message || "Sign up failed");
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
					Check your email
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					We sent a verification link to your email address.
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

			<h1 className="text-2xl text-card-foreground sm:text-3xl">
				Begin your watch
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link
					href="/login"
					className="cursor-pointer font-medium text-primary hover:text-primary/80"
				>
					Sign in
				</Link>
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
				{error && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				)}
				<div className="space-y-2">
					<Label htmlFor="name" className="text-sm text-muted-foreground">
						Name<span className="text-muted-foreground/60">*</span>
					</Label>
					<Input
						id="name"
						autoComplete="name"
						placeholder="Your full name"
						required
						className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
						{...register("name")}
					/>
				</div>

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

				<div className="space-y-2">
					<Label htmlFor="password" className="text-sm text-muted-foreground">
						Password<span className="text-muted-foreground/60">*</span>
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
					{isSubmitting ? "Creating account..." : "Sign up"}
				</Button>
			</form>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				or continue with
			</p>

			<div className="mt-4 grid grid-cols-2 gap-3">
				<Button
					variant="outline"
					type="button"
					onClick={handleGoogle}
					className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
				>
					<GoogleIcon />
					Continue with Google
				</Button>
				<Button
					variant="outline"
					type="button"
					onClick={handleMicrosoft}
					className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
				>
					<MicrosoftIcon />
					Continue with Microsoft
				</Button>
			</div>
		</AuthShell>
	);
}
