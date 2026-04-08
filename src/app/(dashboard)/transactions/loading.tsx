import { TableSkeleton } from "@/components/layout/skeleton-cards";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-14 animate-pulse rounded-lg bg-muted" />
      <TableSkeleton rows={8} />
    </div>
  );
}
