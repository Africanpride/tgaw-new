import { BookOpen } from "lucide-react";
import { format } from "date-fns";
import { DevotionPage } from "@/components/booking/DevotionPage";

export default async function BiblePage(props: {
	searchParams: Promise<{ date?: string }>;
}) {
	const searchParams = await props.searchParams;
	const dateStr = searchParams?.date ?? format(new Date(), "yyyy-MM-dd");

	return (
		<DevotionPage
			dateStr={dateStr}
			type="BIBLE"
			basePath="/bible"
			title="Bible Reading"
			description="Set apart time in the Word — book a quiet window and read with the community."
			icon={BookOpen}
			slotNoun="Bible reading"
			roomLabel="Bible Reading Room"
		/>
	);
}
