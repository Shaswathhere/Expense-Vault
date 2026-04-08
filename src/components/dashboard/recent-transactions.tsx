"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { getCurrencySymbol } from "@/lib/currencies";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  currency: string;
}

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions yet. Add your first one!
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/transactions">Add Transaction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                    t.type === "INCOME"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {t.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(t.date), "MMM d")}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  t.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {t.type === "INCOME" ? "+" : "-"}{getCurrencySymbol(t.currency)}
                {t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
