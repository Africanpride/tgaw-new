import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<p className="text-muted-foreground">
						Your account role does not have permission to view this page.
					</p>
					<Button asChild>
						<Link href="/overview" className="cursor-pointer">
							Return to Dashboard
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
