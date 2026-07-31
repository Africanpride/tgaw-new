/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React from "react"

type Props = {}

export default function Page(props: Props) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 lg:grid-cols-2 lg:py-24">
      <div className="space-y-6 text-center lg:space-y-8 lg:text-start">
        <span
          data-slot="badge"
          data-variant="outline"
          className="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border border-border px-2 py-1 text-xs font-medium whitespace-nowrap text-foreground transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [a]:hover:bg-muted [a]:hover:text-muted-foreground [&>svg]:pointer-events-none [&>svg]:size-3!"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-sun size-4 animate-spin"
            aria-hidden="true"
          >
            <circle cx={12} cy={12} r={4} />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          2.0 version is here
        </span>
        <div className="mx-auto max-w-xl space-y-4 text-center lg:mx-0 lg:text-start">
          <h1 className="text-4xl leading-tight font-bold lg:text-5xl">
            <span>Welcome to the</span> <br />
            <span className="text-muted-foreground italic">innovation</span>
            <span className="text-muted-foreground not-italic"> oasis</span>
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Step into our innovation oasis, where groundbreaking ideas bloom,
            and every click is a step into a world of endless possibilities.
          </p>
        </div>
        <div className="flex justify-center gap-3 lg:justify-start">
          <button
            data-slot="button"
            data-variant="default"
            data-size="lg"
            className="group/button inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-transparent bg-primary bg-clip-padding px-4 text-sm font-medium whitespace-nowrap text-primary-foreground transition-all outline-none select-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            Get Started
          </button>
          <button
            data-slot="button"
            data-variant="outline"
            data-size="lg"
            className="group/button inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background bg-clip-padding px-4 text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 aria-expanded:bg-muted aria-expanded:text-foreground aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-transparent dark:hover:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            Watch Demo
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
        <div className="space-y-6">
          <div
            data-slot="card"
            data-size="default"
            className="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl border-none bg-card p-0 text-sm text-card-foreground shadow-none ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] lg:mt-8 dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl"
          >
            <img
              src="https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Mobile app"
              className="aspect-video w-full object-cover lg:aspect-4/3"
            />
          </div>
          <div
            data-slot="card"
            data-size="default"
            className="group/card flex aspect-video flex-col gap-(--card-spacing) overflow-hidden rounded-4xl border-none bg-muted py-(--card-spacing) text-sm text-card-foreground shadow-none ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] lg:aspect-4/3 dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl"
          >
            <div
              data-slot="card-content"
              className="flex h-full flex-col justify-end px-(--card-spacing)"
            >
              <div>
                <div className="mb-2 text-2xl font-medium md:text-3xl">
                  27k+
                </div>
                <div className="text-muted-foreground">Raised by startups</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4 lg:space-y-6">
          <div
            data-slot="card"
            data-size="default"
            className="group/card flex aspect-video flex-col gap-(--card-spacing) overflow-hidden rounded-4xl border-none bg-muted py-(--card-spacing) text-sm text-card-foreground shadow-none ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] lg:aspect-4/3 dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl"
          >
            <div
              data-slot="card-content"
              className="flex h-full flex-col justify-end px-(--card-spacing)"
            >
              <div>
                <div className="mb-2 text-2xl font-medium md:text-3xl">
                  $14B
                </div>
                <div className="text-muted-foreground">
                  Funds &amp; Syndicates
                </div>
              </div>
            </div>
          </div>
          <div
            data-slot="card"
            data-size="default"
            className="group/card flex aspect-video flex-col gap-(--card-spacing) overflow-hidden rounded-4xl border-none bg-amber-50 py-(--card-spacing) text-sm text-card-foreground shadow-none ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] lg:aspect-4/3 dark:bg-amber-950 dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl"
          >
            <div
              data-slot="card-content"
              className="flex h-full flex-col justify-end px-(--card-spacing)"
            >
              <div className="mb-2 text-2xl font-medium md:text-3xl">80k</div>
              <div className="mb-3 text-muted-foreground">Active members</div>
              <div className="flex -space-x-2">
                <span
                  data-slot="avatar"
                  data-size="default"
                  className="group/avatar relative flex size-8 shrink-0 rounded-full border-3 border-amber-50 select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 lg:size-10 dark:border-amber-950 dark:after:mix-blend-lighten"
                >
                  <img
                    data-slot="avatar-image"
                    className="aspect-square size-full rounded-full object-cover"
                    alt="User"
                    src="https://i.pravatar.cc/80?img=11"
                  />
                </span>
                <span
                  data-slot="avatar"
                  data-size="default"
                  className="group/avatar relative flex size-8 shrink-0 rounded-full border-3 border-amber-50 select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 lg:size-10 dark:border-amber-950 dark:after:mix-blend-lighten"
                >
                  <img
                    data-slot="avatar-image"
                    className="aspect-square size-full rounded-full object-cover"
                    alt="User"
                    src="https://i.pravatar.cc/80?img=12"
                  />
                </span>
                <span
                  data-slot="avatar"
                  data-size="default"
                  className="group/avatar relative flex size-8 shrink-0 rounded-full border-3 border-amber-50 select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 lg:size-10 dark:border-amber-950 dark:after:mix-blend-lighten"
                >
                  <img
                    data-slot="avatar-image"
                    className="aspect-square size-full rounded-full object-cover"
                    alt="User"
                    src="https://i.pravatar.cc/80?img=13"
                  />
                </span>
                <span
                  data-slot="avatar"
                  data-size="default"
                  className="group/avatar relative flex size-8 shrink-0 rounded-full border-3 border-amber-50 select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 lg:size-10 dark:border-amber-950 dark:after:mix-blend-lighten"
                >
                  <img
                    data-slot="avatar-image"
                    className="aspect-square size-full rounded-full object-cover"
                    alt="User"
                    src="https://i.pravatar.cc/80?img=14"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
