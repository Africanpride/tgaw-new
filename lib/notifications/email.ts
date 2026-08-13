import { lookup } from "node:dns/promises";
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST ?? "";

// nodemailer resolves hostnames itself and picks a random A/AAAA record,
// so on hosts without a default IPv6 route ~half of sends fail with
// ENETUNREACH. Resolve IPv4 upfront and pin the hostname via servername
// so TLS SNI/cert verification still uses the real host.
async function getTransport() {
	let host = smtpHost;
	// Only resolve hostnames; IP literals pass through untouched.
	if (smtpHost && !/^\d{1,3}(\.\d{1,3}){3}$/.test(smtpHost)) {
		try {
			const { address } = await lookup(smtpHost, { family: 4 });
			host = address;
		} catch (error) {
			console.error(
				`[ERROR] Failed to resolve SMTP_HOST "${smtpHost}" to IPv4`,
				error instanceof Error ? error.message : String(error)
			);
		}
	}

	return nodemailer.createTransport({
		host,
		port: Number(process.env.SMTP_PORT) || 587,
		secure: false,
		servername: smtpHost || undefined,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	} as nodemailer.TransportOptions);
}

const transporterPromise = getTransport();

export async function sendEmail(to: string, subject: string, html: string) {
	try {
		const transporter = await transporterPromise;
		await transporter.sendMail({
			from: process.env.SMTP_FROM || process.env.SMTP_USER,
			to,
			subject,
			html,
		});
		console.log(`[EMAIL] Sent to ${to}: "${subject}"`);
	} catch (error) {
		console.error(
			`[ERROR] Failed to send email to ${to}: "${subject}"`,
			error instanceof Error ? error.message : String(error)
		);
		throw error;
	}
}