import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export async function VerifyForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const t = await getTranslations("auth");
	return (
		<Card
			className={cn(
				"w-full max-w-md border-none p-2 text-center shadow-sm sm:p-6",
				className,
			)}
			{...props}
		>
			<CardHeader className="flex flex-col items-center gap-4 text-center">
				<Link href="/" className="cursor-pointer">
					<Image
						src="/images/logos/logoicon.svg"
						alt={t("verify.logoAlt")}
						width={40}
						height={40}
						priority
					/>
				</Link>
				<div className="flex flex-col gap-1">
					<CardTitle className="text-xl font-medium">
						{t("verify.title")}
					</CardTitle>
					<CardDescription className="text-sm text-muted-foreground">
						{t("verify.subtitle")}
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<form className="w-full space-y-6">
					<div className="my-4 flex justify-center gap-2">
						{["slot-1", "slot-2", "slot-3", "slot-4", "slot-5", "slot-6"].map(
							(slotId) => (
								<Input
									key={slotId}
									type="text"
									maxLength={1}
									className="h-12 w-10 text-center text-lg font-semibold"
								/>
							),
						)}
					</div>
					<Button type="submit" className="w-full">
						{t("verify.submit")}
					</Button>
				</form>
				<div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
					<p>{t("verify.noCode")}</p>
					<Link className="cursor-pointer font-medium text-primary hover:underline" href="#">
						{t("verify.resend")}
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}