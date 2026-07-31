import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function getSignedUploadParams(folder: string) {
	const timestamp = Math.round(Date.now() / 1000);
	const signature = cloudinary.utils.api_sign_request(
		{ timestamp, folder },
		process.env.CLOUDINARY_API_SECRET!,
	);
	return {
		timestamp,
		signature,
		folder,
		apiKey: process.env.CLOUDINARY_API_KEY,
		cloudName: process.env.CLOUDINARY_CLOUD_NAME,
	};
}
