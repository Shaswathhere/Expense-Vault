"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface OverviewCardsProps {
  totalIncome: number;
  totalExpenses: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  monthlyData?: { month: string; income: number; expenses: number }[];
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="ml-auto opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OverviewCards({
  totalIncome,
  totalExpenses,
  lastMonthIncome,
  lastMonthExpenses,
  monthlyData = [],
}: OverviewCardsProps) {
  const balance = totalIncome - totalExpenses;
  const lastBalance = lastMonthIncome - lastMonthExpenses;
  const incomeChange = pctChange(totalIncome, lastMonthIncome);
  const expenseChange = pctChange(totalExpenses, lastMonthExpenses);
  const balanceChange = pctChange(balance, lastBalance);

  const incomeSparkData = monthlyData.map((m) => m.income);
  const expenseSparkData = monthlyData.map((m) => m.expenses);
  const balanceSparkData = monthlyData.map((m) => m.income - m.expenses);

  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(totalIncome),
      change: incomeChange,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      sparkData: incomeSparkData,
      sparkColor: "#10b981",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(totalExpenses),
      change: expenseChange,
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-500/10",
      invertChange: true,
      sparkData: expenseSparkData,
      sparkColor: "#ef4444",
    },
    {
      title: "Net Balance",
      value: formatCurrency(balance),
      change: balanceChange,
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      sparkData: balanceSparkData,
      sparkColor: "#3b82f6",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const isPositive = card.invertChange
          ? card.change <= 0
          : card.change >= 0;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="mt-1 flex items-center text-xs">
                    {isPositive ? (
                      <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                    )}
                    <span className={isPositive ? "text-emerald-600" : "text-red-600"}>
                      {Math.abs(card.change)}%
                    </span>
                    <span className="ml-1 text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <Sparkline data={card.sparkData} color={card.sparkColor} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
