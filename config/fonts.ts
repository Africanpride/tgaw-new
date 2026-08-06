import { Bebas_Neue, Open_Sans } from "next/font/google";

export const opensans = Open_Sans({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-opensans",
});

export const bebas = Bebas_Neue({
	weight: ["400"],
	subsets: ["latin"],
	style: ["normal"],
	display: "swap",
	adjustFontFallback: false,
	variable: "--font-bebas",
});
