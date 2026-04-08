"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardGreeting } from "@/components/dashboard/greeting";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { BalanceChart } from "@/components/dashboard/balance-chart";
import { SpendingHeatmap } from "@/components/dashboard/spending-heatmap";
import {
  OverviewCardsSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "@/components/layout/skeleton-cards";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });

  if (isLoading || !data) {
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

  return (
    <div className="space-y-6">
      <DashboardGreeting streak={data.streak || 0} />

      <OverviewCards
        totalIncome={data.overview.totalIncome}
        totalExpenses={data.overview.totalExpenses}
        lastMonthIncome={data.overview.lastMonthIncome}
        lastMonthExpenses={data.overview.lastMonthExpenses}
        monthlyData={data.monthlyData}
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingChart data={data.monthlyData} />
        </div>
        <CategoryBreakdown data={data.categoryData} />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <BalanceChart data={data.balanceOverTime} />
        <SpendingHeatmap data={data.dailySpending} />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={data.recentTransactions} />
        </div>
        <BudgetProgress budgets={data.budgetData} />
      </div>
    </div>
  );
}
