import { Church } from "lucide-react";
import { format } from "date-fns";
import { DevotionPage } from "@/components/booking/DevotionPage";

export default async function PrayerPage(props: {
	searchParams: Promise<{ date?: string }>;
}) {
	const searchParams = await props.searchParams;
	const dateStr = searchParams?.date ?? format(new Date(), "yyyy-MM-dd");

	return (
		<DevotionPage
			dateStr={dateStr}
			type="PRAYER"
			basePath="/prayer"
			title="Prayer Watch"
			description="Take your watch on the wall — cover the hours in continuous prayer."
			icon={Church}
			slotNoun="prayer"
			roomLabel="Prayer Room"
		/>
	);
}
