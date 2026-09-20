import { I18nProvider } from "@/providers/I18nProvider"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <I18nProvider>{children}</I18nProvider>
}