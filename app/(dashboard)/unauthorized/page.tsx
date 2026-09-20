import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from "@/i18n/config";
import { getServerTranslation } from "@/lib/notifications/locale";

export default async function UnauthorizedPage() {
	const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
	const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
	const t = (key: string) => getServerTranslation(locale, "errors", key);

	const [title, description, returnText] = await Promise.all([
		t("unauthorized.title"),
		t("unauthorized.description"),
		t("unauthorized.return"),
	]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-2 sm:p-4">
			<Card className="w-full max-w-md text-center">
				<CardHeader className="flex flex-col items-center gap-2">
					<ShieldAlert className="size-10 text-destructive" aria-hidden="true" />
					<CardTitle className="text-2xl">{title}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<p className="text-muted-foreground">{description}</p>
					<Button asChild className="gap-2">
						<Link href="/overview" className="cursor-pointer">
							{returnText}
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}