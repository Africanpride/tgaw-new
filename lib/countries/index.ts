import { countries } from "country-data-list"

import type { Country } from "@/components/country-dropdown"

const AVAILABLE = countries.all.filter(
  (c: Country) =>
    c.emoji && c.status !== "deleted" && c.ioc !== "PRK" && c.name
)

const BY_NAME = new Map<string, Country>(
  AVAILABLE.map((c) => [c.name, c])
)

const BY_ALPHA3 = new Map<string, Country>(
  AVAILABLE.map((c) => [c.alpha3, c])
)

/**
 * Resolve a stored country value to its alpha3 code for the CountryDropdown.
 * Accepts either an alpha3 code (new format) or a country name (legacy format).
 */
export function resolveCountryAlpha3(value?: string): string {
  if (!value) return ""
  if (BY_ALPHA3.has(value)) return value
  return BY_NAME.get(value)?.alpha3 ?? ""
}

/**
 * Resolve a stored country value (alpha3 code or legacy name) to its
 * alpha2 code — used by the PhoneInput's defaultCountry prop.
 */
export function resolveCountryAlpha2(value?: string): string {
  const alpha3 = resolveCountryAlpha3(value)
  return BY_ALPHA3.get(alpha3)?.alpha2 ?? ""
}

export function getCountryList(): Country[] {
  return AVAILABLE
}
