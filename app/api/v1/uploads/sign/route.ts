import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSignedUploadParams } from "@/lib/storage/cloudinary";

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user)
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 },
		);

	try {
		const body = await req.json().catch(() => ({}));
		const folder = body.folder || "tgaw-uploads";

		const params = await getSignedUploadParams(folder);
		return NextResponse.json({ success: true, data: params });
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to generate upload signature";
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
