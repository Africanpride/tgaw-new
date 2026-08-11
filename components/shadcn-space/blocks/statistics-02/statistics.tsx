"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Box, ChartColumnIncreasing, Handbag, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Statistic() {
  const EcommerceActions = [
    {
      title: "Orders",
      subtitle: "5868",
      cardIcon: Handbag,
      badgeColor: "bg-teal-400/10",
      statusValue: "+18%",
    },
    {
      title: "Sales",
      subtitle: "$96,850",
      cardIcon: Box,
      badgeColor: "bg-orange-400/10",
      statusValue: "-5%",
    },
    {
      title: "Profit",
      subtitle: "$82,906",
      cardIcon: ChartColumnIncreasing,
      badgeColor: "bg-teal-400/10",
      statusValue: "+18%",
    },
    {
      title: "Expense",
      subtitle: "$14,653",
      cardIcon: Star,
      badgeColor: "bg-teal-400/10",
      statusValue: "+18%",
    },
  ];

  return (
    <div className="lg:py-20 sm:py-16 py-8">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <Card className="p-0! shadow-xs">
          <CardContent className="flex items-center w-full lg:flex-nowrap flex-wrap px-0!">
            {EcommerceActions.map((item, index) => {
              return (
                <div
                  className="lg:w-3/12 md:w-6/12 w-full border-border border-b last:border-b-0 md:border-e md:even:border-e-0 md:nth-[n+3]:border-b-0 lg:border-b-0 lg:even:border-e lg:last:border-e-0"
                  key={index}
                >
                  <div className="p-6 flex items-start justify-between">
                    <div className="flex flex-col gap-4">
                      <h6 className="text-base font-medium text-card-foreground">
                        {item.title}
                      </h6>
                      <div>
                        <h5 className="text-2xl font-medium text-card-foreground">
                          {item.subtitle}
                        </h5>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Last 7 days
                          </p>
                          <Badge
                            className={cn(
                              "font-normal text-muted-foreground",
                              item.badgeColor,
                            )}
                          >
                            {item.statusValue}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {/* icon */}
                    <div className="p-3 rounded-full outline">
                      <item.cardIcon size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
