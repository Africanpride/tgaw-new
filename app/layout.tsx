// THIS IS THE LAYOUT FOR THE LANDING PAGE
// THE LAYOUT FOR THE DASHBOARD IS IN app/dashboard/layout.tsx
// THE LAYOUT FOR THE AUTHENTICATION PAGES IS IN app/auth/layout.tsx

import {
	Geist_Mono,
	Instrument_Sans,
	Inter,
	JetBrains_Mono,
	Outfit,
	Oxanium,
	Roboto_Slab,
} from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const oxaniumHeading = Oxanium({
	subsets: ["latin"],
	variable: "--font-heading",
});

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

const instrumentSans = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-instrument-sans",
});

const robotoSlab = Roboto_Slab({
	subsets: ["latin"],
	variable: "--font-roboto-slab",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
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
				fontMono.variable,
				instrumentSans.variable,
				robotoSlab.variable,
				jetbrainsMono.variable,
				"font-sans",
				outfit.variable,
				oxaniumHeading.variable,
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
