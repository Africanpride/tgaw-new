// THIS IS THE LAYOUT FOR THE LANDING PAGE
// THE LAYOUT FOR THE DASHBOARD IS IN app/dashboard/layout.tsx
// THE LAYOUT FOR THE AUTHENTICATION PAGES IS IN app/auth/layout.tsx

import { Bebas_Neue, Geist_Mono, Open_Sans } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
	subsets: ["latin"],
	variable: "--font-opensans",
});

const bebasNeue = Bebas_Neue({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-bebas",
});

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(
				"antialiased",
				openSans.variable,
				bebasNeue.variable,
				fontMono.variable,
				"font-sans",
			)}
		>
			<body>
				<ThemeProvider>
					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
