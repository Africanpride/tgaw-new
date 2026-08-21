import { Music } from "lucide-react";
import { format } from "date-fns";
import { DevotionPage } from "@/components/booking/DevotionPage";

export default async function WorshipPage(props: {
	searchParams: Promise<{ date?: string }>;
}) {
	const searchParams = await props.searchParams;
	const dateStr = searchParams?.date ?? format(new Date(), "yyyy-MM-dd");

	return (
		<DevotionPage
			dateStr={dateStr}
			type="PRAISE_WORSHIP"
			basePath="/worship"
			title="Praise & Worship"
			description="Lift a sound of praise — reserve your hour and worship together."
			icon={Music}
			slotNoun="worship"
			roomLabel="Worship Room"
		/>
	);
}
