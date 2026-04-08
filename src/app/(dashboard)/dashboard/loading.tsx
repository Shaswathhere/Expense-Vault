import { OverviewCardsSkeleton, ChartSkeleton, TableSkeleton } from "@/components/layout/skeleton-cards";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <OverviewCardsSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <ChartSkeleton />
      </div>
    </div>
  );
}
