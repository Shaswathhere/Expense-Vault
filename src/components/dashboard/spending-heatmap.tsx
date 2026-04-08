"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SpendingHeatmapProps {
  data: Record<string, number>;
}

function getIntensity(amount: number, max: number): string {
  if (amount === 0) return "bg-muted";
  const ratio = amount / max;
  if (ratio < 0.25) return "bg-emerald-200 dark:bg-emerald-900";
  if (ratio < 0.5) return "bg-emerald-400 dark:bg-emerald-700";
  if (ratio < 0.75) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-700 dark:bg-emerald-400";
}

export function SpendingHeatmap({ data }: SpendingHeatmapProps) {
  const today = new Date();
  const days: { date: string; amount: number; dayOfWeek: number }[] = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      amount: data[dateStr] || 0,
      dayOfWeek: d.getDay(),
    });
  }

  const maxAmount = Math.max(...days.map((d) => d.amount), 1);

  // Group into weeks
  const weeks: (typeof days)[] = [];
  let currentWeek: typeof days = [];
  days.forEach((day) => {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Activity (90 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-[2px] sm:gap-[3px] overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px] sm:gap-[3px]">
              {week.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger
                    render={
                      <div
                        className={`h-3 w-3 rounded-sm ${getIntensity(day.amount, maxAmount)} cursor-default transition-colors hover:ring-1 hover:ring-foreground/20`}
                      />
                    }
                  />
                  <TooltipContent side="top">
                    <p className="text-xs font-medium">
                      {new Date(day.date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.amount > 0
                        ? `₹${day.amount.toLocaleString("en-IN")}`
                        : "No spending"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="h-3 w-3 rounded-sm bg-muted" />
            <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
            <div className="h-3 w-3 rounded-sm bg-emerald-700 dark:bg-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
