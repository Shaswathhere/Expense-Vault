import { Card, CardContent } from "@/components/ui/card";

export default function InsightsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <Card>
        <CardContent className="py-16">
          <div className="mx-auto space-y-4 max-w-md">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-6 w-48 mx-auto animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-72 mx-auto animate-pulse rounded-md bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
