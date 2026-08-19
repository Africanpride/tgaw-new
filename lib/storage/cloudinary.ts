import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const AVATAR_UPLOAD_PRESET = "tgaw_avatars";
export const AVATAR_MAX_BYTES = 1 * 1024 * 1024; // 1MB
export const AVATAR_FOLDER = "tgaw/avatars";

/**
 * Extracts the Cloudinary public_id from an image URL, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/v123/tgaw/avatars/abc123.jpg
 * → "tgaw/avatars/abc123". Returns null when the URL isn't a Cloudinary image URL.
 */
export function getPublicIdFromUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		const marker = "/image/upload/";
		const markerIdx = parsed.pathname.indexOf(marker);
		if (markerIdx === -1) return null;

		let rest = parsed.pathname.slice(markerIdx + marker.length);
		rest = rest.replace(/^v\d+\//, "");
		const lastSlash = rest.lastIndexOf("/");
		const lastDot = rest.lastIndexOf(".");
		if (lastDot > lastSlash) rest = rest.slice(0, lastDot);
		if (!rest) return null;

		return decodeURIComponent(rest);
	} catch {
		return null;
	}
}

/**
 * Deletes a single Cloudinary asset. Logs and swallows failures so the
 * calling flow (profile update) is never blocked by cleanup problems.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		if (result.result !== "ok") {
			console.error(
				`[ERROR] deleteCloudinaryAsset result "${result.result}" for ${publicId}`,
			);
		}
	} catch (error) {
		console.error(`[ERROR] deleteCloudinaryAsset ${publicId}`, error);
	}
}

let presetEnsured = false;

/**
 * Ensures the signed avatar upload preset exists on the Cloudinary account.
 * The preset enforces the 1MB `max_file_size` server-side (source of truth);
 * without it, oversized uploads would only be blocked by the client check.
 * Cached for the lifetime of the process.
 */
async function ensureUploadPreset(): Promise<boolean> {
	if (presetEnsured) return true;

	try {
		await cloudinary.api.upload_preset(AVATAR_UPLOAD_PRESET);
		presetEnsured = true;
		return true;
	} catch {
		// Preset not found — create it below.
	}

	try {
		await cloudinary.api.create_upload_preset({
			name: AVATAR_UPLOAD_PRESET,
			unsigned: false,
			folder: "tgaw/avatars",
			allowed_formats: ["jpg", "jpeg", "png", "webp"],
			max_file_size: AVATAR_MAX_BYTES,
		});
		presetEnsured = true;
		return true;
	} catch (error) {
		console.error("[ERROR] ensureUploadPreset", error);
		return false;
	}
}

export async function getSignedUploadParams(folder: string) {
	const secret = process.env.CLOUDINARY_API_SECRET;
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

	if (!secret || !apiKey || !cloudName) {
		throw new Error(
			"Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing or incomplete in environment variables.",
		);
	}

	const timestamp = Math.round(Date.now() / 1000);
	const presetReady = await ensureUploadPreset();
	const params: Record<string, string | number> = { timestamp, folder };
	if (presetReady) params.upload_preset = AVATAR_UPLOAD_PRESET;

	const signature = cloudinary.utils.api_sign_request(params, secret);
	return {
		timestamp,
		signature,
		folder,
		...(presetReady ? { upload_preset: AVATAR_UPLOAD_PRESET } : {}),
		apiKey,
		cloudName,
	};
}
