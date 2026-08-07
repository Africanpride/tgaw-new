// components/auth/auth-shell.tsx
"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.89c2.27-2.09 3.56-5.17 3.56-8.82Z"
			/>
			<path
				fill="#34A853"
				d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3c-1.08.73-2.46 1.16-4.06 1.16-3.12 0-5.77-2.11-6.71-4.94H1.27v3.1A12 12 0 0 0 12 24Z"
			/>
			<path
				fill="#FBBC05"
				d="M5.29 14.31A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.58.38-2.31v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.41l4.02-3.1Z"
			/>
			<path
				fill="#EA4335"
				d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.59l4.02 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
			/>
		</svg>
	);
}

function GithubIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			className="h-4 w-4"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
			/>
		</svg>
	);
}

function AuthShell({
	children,
	className,
	backgroundImage = "/images/christ_the_redeemer.jpg",
}: {
	children: React.ReactNode;
	className?: string;
	backgroundImage?: string;
}) {
	return (
		<div className="relative min-h-screen w-full overflow-hidden bg-background">
			<div
				className="absolute inset-0 bg-cover bg-center"
				style={{ backgroundImage: `url('${backgroundImage}')` }}
				aria-hidden="true"
			/>
			<div
				className="absolute inset-0 bg-gradient-to-r from-foreground/10 via-foreground/5 to-foreground/0 sm:from-foreground/10 sm:via-foreground/5 sm:to-foreground/0"
				aria-hidden="true"
			/>
			<div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 lg:justify-start lg:p-0 lg:pl-32">
				<div
					className={cn(
						"w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl backdrop-blur-sm sm:p-8",
						className,
					)}
				>
					{children}
				</div>
			</div>
		</div>
	);
}

function AuthBrand() {
	return (
		<div className="mb-8 flex items-center gap-2">
			<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
				t
			</span>
			<span className="text-lg font-semibold text-card-foreground">tgaw.</span>
		</div>
	);
}

export { AuthBrand, AuthShell, GithubIcon, GoogleIcon };
