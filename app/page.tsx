import { LandingContent } from "@/components/landing/landing-content";
import { VerseCard } from "@/components/verse/VerseCard";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return <LandingContent verseSlot={<VerseCard />} />;
}