"use client"

import { forwardRef, useEffect, useState } from "react"
import parsePhoneNumber from "libphonenumber-js"
import { CircleFlag } from "react-circle-flags"
import { lookup } from "country-data-list"
import { GlobeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { phoneSchema } from "@/lib/schemas/phoneSchema"

export { phoneSchema }

export type CountryData = {
	alpha2: string
	alpha3: string
	countryCallingCodes: string[]
	currencies: string[]
	emoji?: string
	ioc: string
	languages: string[]
	name: string
	status: string
}

interface PhoneInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	onCountryChange?: (data: CountryData | undefined) => void
	value?: string
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
	placeholder?: string
	defaultCountry?: string
	className?: string
	inline?: boolean
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
	(
		{
			className,
			onCountryChange,
			onChange,
			value,
			placeholder,
			defaultCountry,
			inline = false,
			id,
			...props
		},
		ref
	) => {
		const [displayFlag, setDisplayFlag] = useState("")
		const [hasInitialized, setHasInitialized] = useState(false)

		useEffect(() => {
			if (!defaultCountry) return
			const newCountryData = lookup.countries({
				alpha2: defaultCountry.toLowerCase(),
			})[0] as CountryData | undefined
			setDisplayFlag(defaultCountry.toLowerCase())

			if (
				!hasInitialized &&
				newCountryData?.countryCallingCodes?.[0] &&
				!value
			) {
				onChange?.({
					target: { value: newCountryData.countryCallingCodes[0] },
				} as React.ChangeEvent<HTMLInputElement>)
				setHasInitialized(true)
			}
		}, [defaultCountry, onChange, value, hasInitialized])

		const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			let newValue = e.target.value

			if (!newValue.startsWith("+")) {
				newValue = newValue.startsWith("00")
					? "+" + newValue.slice(2)
					: "+" + newValue
			}

			try {
				const parsed = parsePhoneNumber(newValue)
				if (parsed?.country) {
					const countryCode = parsed.country.toLowerCase()
					setDisplayFlag(countryCode)

					const countryInfo = lookup.countries({
						alpha2: parsed.country,
					})[0] as CountryData | undefined
					onCountryChange?.(countryInfo)

					onChange?.({
						...e,
						target: { ...e.target, value: parsed.number },
					} as React.ChangeEvent<HTMLInputElement>)
				} else {
					onChange?.(e)
					setDisplayFlag("")
					onCountryChange?.(undefined)
				}
			} catch {
				onChange?.(e)
				setDisplayFlag("")
				onCountryChange?.(undefined)
			}
		}

		const inputClasses = cn(
			"flex items-center gap-2 relative bg-transparent transition-colors text-base rounded-md border border-input pl-3 h-10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed md:text-sm has-[input:focus]:outline-none has-[input:focus]:ring-1 has-[input:focus]:ring-ring",
			inline && "rounded-l-none w-full",
			className
		)

		return (
			<div className={inputClasses}>
				{!inline && (
					<div
						key={displayFlag || "none"}
						className="flex size-4 shrink-0 items-center rounded-full"
					>
						{displayFlag ? (
							<CircleFlag countryCode={displayFlag} height={16} />
						) : (
							<GlobeIcon
								size={16}
								aria-hidden="true"
								className="text-muted-foreground"
							/>
						)}
					</div>
				)}
				<input
					ref={ref}
					id={id}
					value={value}
					onChange={handlePhoneChange}
					placeholder={placeholder || "Enter your phone number"}
					type="tel"
					autoComplete="tel"
					className={cn(
						"h-10 w-full flex-1 border-none bg-transparent p-0 py-1 text-base leading-none outline-none placeholder:text-muted-foreground transition-colors md:text-sm",
						className
					)}
					{...props}
				/>
			</div>
		)
	}
)

PhoneInput.displayName = "PhoneInput"