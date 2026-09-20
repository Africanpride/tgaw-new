import { Church } from "lucide-react";
import { format } from "date-fns";
import { cookies } from "next/headers";
import { DevotionPage } from "@/components/booking/DevotionPage";
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_NAME,
	isLocale,
} from "@/i18n/config";
import { getServerTranslation } from "@/lib/notifications/locale";

export default async function PrayerPage(props: {
	searchParams: Promise<{ date?: string }>;
}) {
	const searchParams = await props.searchParams;
	const dateStr = searchParams?.date ?? format(new Date(), "yyyy-MM-dd");

	const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
	const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
	const t = (key: string) => getServerTranslation(locale, "prayer", key);
	const [title, description, slotNoun, roomLabel] = await Promise.all([
		t("title"),
		t("description"),
		t("slotNoun"),
		t("roomLabel"),
	]);

	return (
		<DevotionPage
			dateStr={dateStr}
			type="PRAYER"
			basePath="/prayer"
			title={title}
			description={description}
			icon={Church}
			slotNoun={slotNoun}
			roomLabel={roomLabel}
		/>
	);
}