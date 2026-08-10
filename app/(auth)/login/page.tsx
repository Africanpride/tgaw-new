"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	AuthBrand,
	AuthShell,
	GithubIcon,
	GoogleIcon,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
	email: z.string().email("Invalid email"),
	password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});

	async function onSubmit(data: LoginForm) {
		setError(null);
		const result = await authClient.signIn.email({
			email: data.email,
			password: data.password,
		});
		if (result.error) {
			setError(result.error.message || "Invalid credentials");
		} else {
			router.push("/overview");
		}
	}

	async function handleGithub() {
		await authClient.signIn.social({
			provider: "github",
			callbackURL: "/overview",
		});
	}

	async function handleGoogle() {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/overview",
		});
	}

	return (
		<AuthShell>
			<AuthBrand />

			<h1 className="text-2xl text-card-foreground sm:text-3xl">
				Welcome back
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Don&apos;t have an account?{" "}
				<Link
					href="/signup"
					className="cursor-pointer font-medium text-primary hover:text-primary/80"
				>
					Sign up for free
				</Link>
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
				{error && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				)}
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
						autoComplete="current-password"
						placeholder="Enter your password"
						required
						className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
						{...register("password")}
					/>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Checkbox
							id="remember"
							className="border-border data-[checked]:bg-primary data-[checked]:text-primary-foreground"
						/>
						<Label
							htmlFor="remember"
							className="text-sm font-normal text-muted-foreground"
						>
							Remember this device
						</Label>
					</div>
					<Link
						href="/forgot-password"
						className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
					>
						Forgot password?
					</Link>
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{isSubmitting ? "Signing in..." : "Log in"}
				</Button>
			</form>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				or sign in with
			</p>

			<div className="mt-4 grid grid-cols-2 gap-3">
				<Button
					variant="outline"
					type="button"
					onClick={handleGoogle}
					className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
				>
					<GoogleIcon />
					Sign in with Google
				</Button>
				<Button
					variant="outline"
					type="button"
					onClick={handleGithub}
					className="h-11 w-full cursor-pointer justify-center gap-2 border-input bg-background text-foreground hover:bg-accent"
				>
					<GithubIcon />
					Sign in with Github
				</Button>
			</div>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				<Link
					href="/"
					className="cursor-pointer font-medium text-primary hover:text-primary/80"
				>
					Back to home
				</Link>
			</p>
		</AuthShell>
	);
}
