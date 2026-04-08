"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonPulse({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className || ""}`}
      style={style}
    />
  );
}

export function OverviewCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <SkeletonPulse className="h-8 w-32 mb-2" />
            <SkeletonPulse className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonPulse className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-end gap-2 pt-4">
          {[60, 80, 45, 90, 55, 70, 85, 40, 75, 65, 50, 95].map((h, i) => (
            <SkeletonPulse
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ height: `${h}%` } as React.CSSProperties}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b p-4">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonPulse key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-5 w-20 rounded-full" />
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-5 w-16 rounded-full" />
            <SkeletonPulse className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BudgetCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <SkeletonPulse className="h-5 w-28" />
            <SkeletonPulse className="h-8 w-8" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-4 w-24" />
            </div>
            <SkeletonPulse className="h-2 w-full rounded-full" />
            <SkeletonPulse className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListItemSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <SkeletonPulse className="h-6 w-10 rounded-full" />
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-32" />
                <div className="flex gap-2">
                  <SkeletonPulse className="h-4 w-16 rounded-full" />
                  <SkeletonPulse className="h-4 w-24" />
                </div>
              </div>
            </div>
            <SkeletonPulse className="h-5 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
