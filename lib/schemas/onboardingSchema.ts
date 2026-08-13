import { z } from "zod"
import { phoneSchema } from "@/lib/schemas/phoneSchema"

export const nameStepSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
})

export const contactStepSchema = z.object({
	phone: phoneSchema,
	country: z.string().min(1, "Select a country"),
})

export const aboutStepSchema = z.object({
  sex: z.enum(["male", "female"], { message: "Select an option" }),
  ageRange: z.enum(
    ["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65-plus"],
    { message: "Select an age range" }
  ),
})

export const timezoneStepSchema = z.object({
  timezone: z.string().min(1, "Select your time zone"),
})

export const onboardingSchema = nameStepSchema
  .merge(contactStepSchema)
  .merge(aboutStepSchema)
  .merge(timezoneStepSchema)

export type OnboardingValues = z.infer<typeof onboardingSchema>

export const ONBOARDING_STEPS = [
  { id: "name", label: "Your Name", schema: nameStepSchema },
  { id: "contact", label: "Contact", schema: contactStepSchema },
  { id: "about", label: "About You", schema: aboutStepSchema },
  { id: "timezone", label: "Time Zone", schema: timezoneStepSchema },
  { id: "complete", label: "Complete", schema: z.object({}) },
] as const

export const TIMEZONE_OPTIONS = [
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Honolulu" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Los Angeles" },
  { value: "America/Denver", label: "(GMT-07:00) Denver" },
  { value: "America/Chicago", label: "(GMT-06:00) Chicago" },
  { value: "America/New_York", label: "(GMT-05:00) New York" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Africa/Accra", label: "(GMT+00:00) Accra" },
  { value: "Africa/Lagos", label: "(GMT+01:00) Lagos" },
  { value: "Europe/Berlin", label: "(GMT+01:00) Berlin" },
  { value: "Africa/Johannesburg", label: "(GMT+02:00) Johannesburg" },
  { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) Kolkata" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
] as const
