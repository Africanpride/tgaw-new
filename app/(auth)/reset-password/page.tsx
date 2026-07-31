"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">Invalid link</CardTitle>
						<CardDescription>
							This password reset link is invalid or has expired.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link
							href="/forgot-password"
							className="cursor-pointer text-primary hover:underline"
						>
							Request a new link
						</Link>
					</CardContent>
				</Card>
			</div>
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
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">Password reset</CardTitle>
						<CardDescription>
							Your password has been reset successfully.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link
							href="/login"
							className="cursor-pointer text-primary hover:underline"
						>
							Sign in
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Reset password</CardTitle>
					<CardDescription>Enter your new password</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">New password</Label>
							<Input id="password" type="password" {...register("password")} />
						</div>
						<Button type="submit" disabled={isSubmitting} className="w-full">
							{isSubmitting ? "Resetting..." : "Reset password"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}
