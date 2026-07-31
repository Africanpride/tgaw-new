"use client";

import { useState, useTransition } from "react";
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

export default function TwoFactorPage() {
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	async function handleVerify() {
		if (code.length !== 6) return;
		setError(null);
		startTransition(async () => {
			const result = await authClient.twoFactor.verifyTotp({ code });
			if (result.error) {
				setError(result.error.message || "Invalid code");
			} else {
				window.location.href = "/";
			}
		});
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">
						Two-Factor Authentication
					</CardTitle>
					<CardDescription>
						Enter the 6-digit code from your authenticator app.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						<div className="flex flex-col gap-2">
							<Label htmlFor="code">Code</Label>
							<Input
								id="code"
								value={code}
								onChange={(e) =>
									setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
								}
								maxLength={6}
								placeholder="000000"
								className="text-center text-lg tracking-widest"
							/>
						</div>
						<Button
							onClick={handleVerify}
							disabled={code.length !== 6 || isPending}
							className="w-full"
						>
							{isPending ? "Verifying..." : "Verify"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
