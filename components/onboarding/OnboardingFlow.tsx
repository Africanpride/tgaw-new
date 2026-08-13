"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"

import { CountryDropdown } from "@/components/country-dropdown"
import { PhoneInput } from "@/components/phone-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import {
  ONBOARDING_STEPS,
  TIMEZONE_OPTIONS,
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/schemas/onboardingSchema"
import { resolveCountryAlpha3, resolveCountryAlpha2 } from "@/lib/countries"
import { useSession } from "@/lib/auth-client"

const AGE_RANGES = [
  "under-18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65-plus",
] as const

export function OnboardingFlow({
  onComplete,
}: {
  onComplete: (values: OnboardingValues) => void
}) {
  const { data: session } = useSession()
  const [stepIndex, setStepIndex] = useState(0)
  const step = ONBOARDING_STEPS[stepIndex]
  const isLastContentStep = stepIndex === ONBOARDING_STEPS.length - 2
  const isCompleteStep = stepIndex === ONBOARDING_STEPS.length - 1

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
  })

  useEffect(() => {
    if (session?.user?.name) {
      form.setValue("name", session.user.name, { shouldValidate: true })
    }
  }, [session, form])

  async function goNext() {
    const fields = Object.keys(step.schema.shape) as (keyof OnboardingValues)[]
    const valid = fields.length === 0 || (await form.trigger(fields))
    if (!valid) return

    if (isLastContentStep) {
      await onComplete(form.getValues())
    }
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1))
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  return (
    <div className="bg-background">
      <div className="grid min-h-screen md:grid-cols-5">
        {/* Cover panel */}
        <div className="relative hidden overflow-hidden md:col-span-2 md:block">
          <Image
            src="/onboarding.jpg"
            alt="Community fellowship"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute top-8 left-8 flex items-center gap-2.5 lg:top-10 lg:left-10">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <ShieldCheck className="size-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold text-white drop-shadow">
              The Global Altar Watch
            </span>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col md:col-span-3">
          {/* Mobile brand bar */}
          <div className="flex items-center gap-2 border-b px-6 py-4 md:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold">
              The Global Altar Watch 123
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
            <div className="mx-auto w-full max-w-lg">
              <Stepper stepIndex={stepIndex} />

              <div className="mt-10 min-h-[340px]">
                {step.id === "name" && <NameStep form={form} />}
                {step.id === "contact" && <ContactStep form={form} />}
                {step.id === "about" && <AboutStep form={form} />}
                {step.id === "timezone" && <TimezoneStep form={form} />}
                {isCompleteStep && <CompleteStep />}
              </div>

              {!isCompleteStep && (
                <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
                  {stepIndex > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={goBack}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button
                    type="button"
                    onClick={goNext}
                    className="gap-1.5 px-6"
                  >
                    {isLastContentStep ? "Finish" : "Next"}
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stepper({ stepIndex }: { stepIndex: number }) {
  const contentSteps = ONBOARDING_STEPS
  const currentLabel = contentSteps[stepIndex].label

  return (
    <div className="w-full">
      {/* Desktop: circles + connecting lines */}
      <div className="hidden items-center sm:flex">
        {contentSteps.map((s, i) => {
          const isComplete = i < stepIndex
          const isActive = i === stepIndex
          return (
            <div
              key={s.id}
              className="relative flex flex-1 flex-col items-center"
            >
              {i > 0 && (
                <div
                  className={cn(
                    "absolute top-5 right-1/2 h-0.5 w-full -translate-y-1/2 transition-colors duration-300",
                    i <= stepIndex ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                  isComplete && "bg-primary text-primary-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isComplete && !isActive && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-2.5 text-center text-xs font-medium transition-colors duration-300",
                  isComplete || isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile: compact progress bar */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">{currentLabel}</span>
          <span className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {contentSteps.length}
          </span>
        </div>
        <div className="flex gap-1">
          {contentSteps.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i < stepIndex && "bg-primary",
                i === stepIndex && "bg-primary/60",
                i > stepIndex && "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Step content ---

function NameStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const { register, formState } = form
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">What&apos;s your name?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is how other members will see you.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Kwame Mensah"
            className="h-12"
            {...register("name")}
          />
          {formState.errors.name && (
            <p className="text-sm text-destructive">
              {formState.errors.name.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
	const { watch, setValue, formState } = form
	return (
		<div className="space-y-5">
			<div>
				<h2 className="text-lg font-semibold">How can we reach you?</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Used for reminders and account recovery.
				</p>
			</div>
			<div className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="phone">
						Phone number <span className="text-destructive">*</span>
					</Label>
					<PhoneInput
						id="phone"
						value={watch("phone") ?? ""}
						onChange={(e) =>
							setValue("phone", e.target.value, {
								shouldValidate: true,
							})
						}
						defaultCountry={resolveCountryAlpha2(watch("country"))}
						onCountryChange={(country) => {
							if (country) {
								setValue("country", country.alpha3, {
									shouldValidate: true,
								})
							}
						}}
						placeholder="Enter your phone number"
						className="h-12 w-full"
						aria-invalid={!!formState.errors.phone}
					/>
					{formState.errors.phone && (
						<p className="text-sm text-destructive">
							{formState.errors.phone.message}
						</p>
					)}
				</div>
				<div className="space-y-1.5">
					<Label>
						Country <span className="text-destructive">*</span>
					</Label>
					<CountryDropdown
						defaultValue={resolveCountryAlpha3(watch("country"))}
						onChange={(country) =>
							setValue("country", country.alpha3, {
								shouldValidate: true,
							})
						}
						className="h-12 w-full"
						placeholder="Select your country"
					/>
					{formState.errors.country && (
						<p className="text-sm text-destructive">
							{formState.errors.country.message}
						</p>
					)}
				</div>
			</div>
		</div>
	)
}

function AboutStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const { watch, setValue, formState } = form
  const sex = watch("sex")
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">A bit about you</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Helps us tailor slots and groups.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Sex <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setValue("sex", "male", { shouldValidate: true })
              }
              className={cn(
                "flex items-start gap-4 rounded-xl border p-5 text-left transition-all cursor-pointer",
                sex === "male"
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  sex === "male" ? "bg-primary/10" : "bg-muted"
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "size-5",
                    sex === "male" ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Male</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Brother in faith
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setValue("sex", "female", { shouldValidate: true })
              }
              className={cn(
                "flex items-start gap-4 rounded-xl border p-5 text-left transition-all cursor-pointer",
                sex === "female"
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  sex === "female" ? "bg-primary/10" : "bg-muted"
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "size-5",
                    sex === "female" ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Female</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Sister in faith
                </div>
              </div>
            </button>
          </div>
          {formState.errors.sex && (
            <p className="text-sm text-destructive">
              {formState.errors.sex.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Age range <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch("ageRange") ?? ""}
            onValueChange={(v) =>
              v &&
              setValue("ageRange", v as OnboardingValues["ageRange"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="h-12 w-full data-[size=default]:h-12">
              <SelectValue placeholder="Select your age range" />
            </SelectTrigger>
            <SelectContent>
              {AGE_RANGES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.replace("-", "\u2013")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formState.errors.ageRange && (
            <p className="text-sm text-destructive">
              {formState.errors.ageRange.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function TimezoneStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const { watch, setValue, formState } = form
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Your time zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Slots and reminders are shown in your local time.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>
          Time zone <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch("timezone") ?? ""}
          onValueChange={(v) =>
            v && setValue("timezone", v, { shouldValidate: true })
          }
        >
          <SelectTrigger className="h-12 w-full data-[size=default]:h-12">
            <SelectValue placeholder="Select your time zone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formState.errors.timezone && (
          <p className="text-sm text-destructive">
            {formState.errors.timezone.message}
          </p>
        )}
      </div>
    </div>
  )
}

function CompleteStep() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Check className="size-7 text-primary" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">You&apos;re all set</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile is ready. Let&apos;s find your first slot.
        </p>
      </div>
      <Button className="w-full" asChild>
        <Link href="/overview">Go to dashboard</Link>
      </Button>
    </div>
  )
}
