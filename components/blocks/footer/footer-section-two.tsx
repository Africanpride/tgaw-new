import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
  IconMail,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function FooterSectionTwo() {
  const t = useTranslations("common");

  const links = [
    { title: t("nav.features"), href: "/#features" },
    { title: t("nav.community"), href: "/feed" },
    { title: t("footer.privacy"), href: "/privacy" },
    { title: t("footer.terms"), href: "/terms" },
    { title: t("footer.cookies"), href: "/cookies" },
  ];

  const socials = [
    {
      title: "LinkedIn",
      href: "https://linkedin.com",
      icon: IconBrandLinkedin,
    },
    {
      title: "GitHub",
      href: "https://github.com/anomalyco/tgaw",
      icon: IconBrandGithub,
    },
    {
      title: "Twitter",
      href: "https://x.com",
      icon: IconBrandX,
    },
    {
      title: t("footer.social.email"),
      href: "mailto:info@tgaw.app",
      icon: IconMail,
    },
  ];

  return (
    <footer className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-semibold text-foreground">
                TGA<span className="text-red-500">W</span>
              </span>
              <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                {t("footer.tagline")}
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {links.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className="cursor-pointer text-sm font-normal text-neutral-600 transition-colors duration-200 hover:text-black dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-dashed border-neutral-200 py-6 sm:flex-row dark:border-neutral-800">
          <span className="text-center text-sm text-muted-foreground sm:text-left">
            {t("footer.rights", { year: new Date().getFullYear() })} · <Link href="/privacy" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("footer.privacy")}</Link> ·{" "}
            <Link href="/terms" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("footer.terms")}</Link> ·{" "}
            <Link href="/cookies" className="cursor-pointer underline underline-offset-2 hover:text-foreground">{t("footer.cookies")}</Link>
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