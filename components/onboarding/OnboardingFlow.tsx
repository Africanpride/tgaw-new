"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useForm, type UseFormReturn, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"

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

const COUNTRIES = [
  "Ghana",
  "Nigeria",
  "United States",
  "United Kingdom",
  "South Africa",
  "Kenya",
  "Other",
] // placeholder — swap for a full ISO country list

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
  const [stepIndex, setStepIndex] = useState(0)
  const step = ONBOARDING_STEPS[stepIndex]
  const isLastContentStep = stepIndex === ONBOARDING_STEPS.length - 2
  const isCompleteStep = stepIndex === ONBOARDING_STEPS.length - 1

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
  })

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
      <div className="grid min-h-screen md:grid-cols-2">
        {/* Cover panel */}
        <div className="relative hidden overflow-hidden md:block">
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
        <div className="flex flex-col">
          {/* Mobile brand bar */}
          <div className="flex items-center gap-2 border-b px-6 py-4 md:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold">
              The Global Altar Watch 123
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <Stepper stepIndex={stepIndex} />

              <div className="mt-8 min-h-[320px]">
                {step.id === "name" && <NameStep form={form} />}
                {step.id === "contact" && <ContactStep form={form} />}
                {step.id === "about" && <AboutStep form={form} />}
                {step.id === "timezone" && <TimezoneStep form={form} />}
                {isCompleteStep && <CompleteStep />}
              </div>

              {!isCompleteStep && (
                <div className="mt-6 flex items-center justify-between border-t pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={stepIndex === 0}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Back
                  </Button>
                  <Button type="button" onClick={goNext} className="gap-1.5">
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
                    "absolute top-5 right-1/2 h-0.5 w-full -translate-y-1/2",
                    i <= stepIndex ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
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
                  "mt-2 text-center text-xs font-medium",
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
          <Label htmlFor="firstName">
            First name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="Kwame"
            {...register("firstName")}
          />
          {formState.errors.firstName && (
            <p className="text-sm text-destructive">
              {formState.errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">
            Last name <span className="text-destructive">*</span>
          </Label>
          <Input id="lastName" placeholder="Mensah" {...register("lastName")} />
          {formState.errors.lastName && (
            <p className="text-sm text-destructive">
              {formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const { register, watch, setValue, formState } = form
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
          <Input
            id="phone"
            placeholder="+233 20 000 0000"
            {...register("phone")}
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
          <Select
            value={watch("country") ?? ""}
            onValueChange={(v) =>
              v && setValue("country", v, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
  const { control, watch, setValue, formState } = form
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
          <Controller
            control={control}
            name="sex"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="male" id="sex-male" />
                  <Label htmlFor="sex-male" className="font-normal">
                    Male
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="female" id="sex-female" />
                  <Label htmlFor="sex-female" className="font-normal">
                    Female
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
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
            <SelectTrigger className="w-full">
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
          <SelectTrigger className="w-full">
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
