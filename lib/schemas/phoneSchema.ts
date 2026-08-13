import { isValidPhoneNumber } from "libphonenumber-js"
import { z } from "zod"

/**
 * Validates an E.164-style phone number (the format PhoneInput emits).
 * Shared between client schemas (settings page, onboarding) and the
 * server-side settings action so validation stays in sync.
 */
export const phoneSchema = z
	.string()
	.min(1, "Phone number is required")
	.refine((value) => {
		try {
			return isValidPhoneNumber(value)
		} catch {
			return false
		}
	}, "Enter a valid phone number")