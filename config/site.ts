// /config/site.ts
export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name: "The Global Altar Watch",
	shortName: "TGAW",
	description:
		"A Christian community platform for daily devotion, prayer, Bible reading, praise and worship, fellowship, and faith growth.",
	author: "TGAW",
	year: new Date().getFullYear(),
	navItems: [
		{
			label: "Home",
			href: "/",
			number: "01",
		},
		{
			label: "About",
			href: "/about",
			number: "02",
		},
	],

	links: {
		github: "https://github.com",
		twitter: "https://twitter.com",
		facebook: "https://www.facebook.com",
	},
};

export const quickLinks = [
	{
		label: "Privacy Policy",
		href: "/privacy",
	},
	{
		label: "Terms & Conditions",
		href: "/terms",
	},
	{
		label: "Cookies",
		href: "/cookies",
	},
];

export const menuItems = [
	{ number: "01", label: "Home", href: "/" },
	{ number: "02", label: "About", href: "/about" },
	{ number: "03", label: "Dashboard", href: "/dashboard" },
	{ number: "04", label: "Sign In", href: "/login" },
];

export const shareSocial = {
	url: "https://tgaw.app",
	title: "The Global Altar Watch",
};

export const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		// Running on the client
		return "";
	}
	// Running on the server
	return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
};

export const email: string = "info@tgaw.app";
export const phone: string = "";
export const address: string = "";
