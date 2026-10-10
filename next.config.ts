import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "",
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "res.cloudinary.com" },
		],
	},
	output: "standalone",
  // When output is 'standalone', next-intl may need this adjustment:
  // trailingSlash: false,
serverExternalPackages: ["mongodb"],
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
export default withNextIntl(nextConfig);