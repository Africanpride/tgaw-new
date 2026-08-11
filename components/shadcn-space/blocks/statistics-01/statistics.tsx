import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, CalendarDays, LucideIcon, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardMetric = {
  label: string
  value: string
  percentage: string
  isPositive?: boolean
}

type MainDashboardData = {
  title: string
  description: string
  metrics: DashboardMetric[]
}

type StatItem = {
  title: string
  value: string
  percentage: string
  icon: LucideIcon
  isPositive?: boolean
}

type StatisticsBlock01Props = {
  mainDashboard?: MainDashboardData
  secondaryStats?: StatItem[]
}

const mainDashboardData: MainDashboardData = {
  title: "Analytics Dashboard",
  description: "Check all the statistics",
  metrics: [
    {
      label: "Earnings",
      value: "$27,850",
      percentage: "+18%",
      isPositive: true,
    },
    {
      label: "Expense",
      value: "$18,453",
      percentage: "-5%",
      isPositive: false,
    },
  ],
}

const secondaryStatsData: StatItem[] = [
  {
    title: "Weekly Sales",
    value: "$4,587",
    percentage: "+18%",
    icon: CalendarDays,
    isPositive: true,
  },
  {
    title: "Purchase Orders",
    value: "230",
    percentage: "+18%",
    icon: ShoppingBag,
    isPositive: true,
  },
]

const Statistics = ({
  mainDashboard = mainDashboardData,
  secondaryStats = secondaryStatsData,
}: StatisticsBlock01Props) => {
  return (
    <div className="w-full py-4">
      <div className="mx-auto w-full">
        <div className="grid h-full grid-cols-12 gap-6">
          <div className="col-span-12 h-full shadow-xs xl:col-span-6">
            <Card className="relative h-full rounded-xl border p-0! ring-0">
              <CardContent className="p-0!">
                <div className="flex flex-col justify-between gap-9 py-4 ps-6">
                  <div>
                    <h6 className="text-lg font-medium text-card-foreground">
                      {mainDashboard.title}
                    </h6>
                    <p className="text-xs font-normal text-muted-foreground">
                      {mainDashboard.description}
                    </p>
                  </div>

                  <div className="xs:flex-nowrap flex flex-wrap gap-6">
                    {mainDashboard.metrics.map((metric, index) => (
                      <div
                        key={index}
                        className="flex w-full items-center gap-6 sm:w-auto"
                      >
                        <div>
                          <p className="text-xs font-normal text-muted-foreground">
                            {metric.label}
                          </p>
                          <div className="flex items-center gap-1">
                            <h5 className="text-2xl font-medium text-card-foreground">
                              {metric.value}
                            </h5>
                            <Badge
                              className={cn(
                                "font-normal text-muted-foreground",
                                metric.isPositive
                                  ? "bg-teal-400/10"
                                  : "bg-red-500/10"
                              )}
                            >
                              {metric.percentage}
                            </Badge>
                          </div>
                        </div>
                        {index < mainDashboard.metrics.length - 1 && (
                          <Separator
                            orientation="vertical"
                            className={"hidden h-12 sm:block"}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* image */}
                <img
                  src="https://images.shadcnspace.com/assets/backgrounds/stats-01.webp"
                  alt="user-img"
                  width={211}
                  height={168}
                  className="absolute right-0 bottom-0 hidden sm:block"
                />
              </CardContent>
            </Card>
          </div>

          {secondaryStats.map((stat, index) => (
            <div
              key={index}
              className="col-span-12 sm:col-span-6 xl:col-span-3"
            >
              <Card className="rounded-xl border p-6! shadow-xs ring-0">
                <CardContent className="flex items-start justify-between p-0!">
                  <div className="flex flex-col justify-between gap-5">
                    <div className="flex flex-col gap-1">
                      <h6 className="text-lg font-medium text-card-foreground">
                        {stat.title}
                      </h6>
                      <div className="flex items-center gap-2">
                        <h5 className="text-2xl font-medium text-card-foreground">
                          {stat.value}
                        </h5>
                        <Badge
                          className={cn(
                            "font-normal text-muted-foreground",
                            stat.isPositive !== false
                              ? "bg-teal-400/10"
                              : "bg-red-500/10"
                          )}
                        >
                          {stat.percentage}
                        </Badge>
                      </div>
                    </div>
                    {/* button */}
                    <Button
                      variant={"outline"}
                      className={
                        "flex h-9 w-fit cursor-pointer items-center gap-1.5 rounded-lg px-4 shadow-xs"
                      }
                    >
                      <span>See Report</span>
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                  <div className="rounded-full p-3 outline">
                    <stat.icon size={20} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Statistics
