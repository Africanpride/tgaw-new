import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "",
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "res.cloudinary.com" },
		],
	},
	serverExternalPackages: ["mongodb"],
};

export default nextConfig;