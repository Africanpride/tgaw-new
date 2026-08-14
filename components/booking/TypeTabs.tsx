"use client";

import { EventType } from "@prisma/client";
import { BookOpen, HandHeart, Music } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TypeTabsProps {
  value: EventType;
  onChange: (value: EventType) => void;
}

export function TypeTabs({ value, onChange }: TypeTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as EventType)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger 
          value="BIBLE" 
          className={cn("data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900 dark:data-[state=active]:text-purple-100")}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Bible Reading</span>
          <span className="sm:hidden">Bible</span>
        </TabsTrigger>
        <TabsTrigger 
          value="PRAYER"
          className={cn("data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900 dark:data-[state=active]:text-red-100")}
        >
          <HandHeart className="w-4 h-4 mr-2" />
          Prayer
        </TabsTrigger>
        <TabsTrigger 
          value="PRAISE_WORSHIP"
          className={cn("data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900 dark:data-[state=active]:text-amber-100")}
        >
          <Music className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Praise & Worship</span>
          <span className="sm:hidden">Worship</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
