// import LogoMark from '@/site/ui-library/ui-library-logo'
import {
	IconBrandGithub,
	IconBrandLinkedin,
	IconBrandX,
	IconMail,
} from "@tabler/icons-react";
import Link from "next/link";

const links = [
	{ title: "Features", href: "#features" },
	{ title: "About", href: "#about" },
	{ title: "Community", href: "/feed" },
	{ title: "Pricing", href: "#pricing" },
	{ title: "Help", href: "/notifications" },
];

const socials = [
	{
		title: "LinkedIn",
		href: "https://linkedin.com",
		icon: IconBrandLinkedin,
	},
	{
		title: "GitHub",
		href: "https://github.com",
		icon: IconBrandGithub,
	},
	{
		title: "Twitter",
		href: "https://x.com",
		icon: IconBrandX,
	},
	{
		title: "Email",
		href: "mailto:hello@tgaw.app",
		icon: IconMail,
	},
];

export default function FooterSectionTwo() {
	return (
		<footer className="py-40">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-1">
							{/* <LogoMark aria-hidden="true" className="size-6" /> */}
							<span className="text-lg font-semibold text-foreground">
								TGA<span className="text-red-500">W</span>
							</span>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
						{links.map((item) => (
							<Link
								href={item.href}
								key={item.title}
								className="text-sm font-normal text-neutral-600 transition-colors duration-200 hover:text-black dark:text-neutral-400 dark:hover:text-neutral-100"
							>
								{item.title}
							</Link>
						))}
					</div>
				</div>

				<div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-dashed border-neutral-200 py-6 sm:flex-row dark:border-neutral-800">
					<span className="text-center text-sm text-muted-foreground sm:text-left">
						© {new Date().getFullYear()} The Global Altar Watch. All rights
						reserved.
					</span>
					<ul className="flex items-center gap-5">
						{socials.map((item) => {
							const Icon = item.icon;
							return (
								<li key={item.title}>
									<a
										href={item.href}
										aria-label={item.title}
										className="text-neutral-700 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
									>
										<Icon aria-hidden="true" className="size-5" />
									</a>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</footer>
	);
}
