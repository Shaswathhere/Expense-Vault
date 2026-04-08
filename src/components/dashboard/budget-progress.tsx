"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface BudgetData {
  category: string;
  budgeted: number;
  spent: number;
}

export function BudgetProgress({ budgets }: { budgets: BudgetData[] }) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No budgets set. Create one to track spending!
          </p>
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/budgets">Set Budget</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Progress</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/budgets">
            Manage <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {budgets.map((b) => {
          const pct = b.budgeted > 0 ? Math.min((b.spent / b.budgeted) * 100, 100) : 0;
          const isOver = b.spent > b.budgeted;
          return (
            <div key={b.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{b.category}</span>
                <span className="text-muted-foreground">
                  ₹{b.spent.toLocaleString("en-IN")} / ₹{b.budgeted.toLocaleString("en-IN")}
                </span>
              </div>
              <Progress
                value={pct}
                className={isOver ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}
              />
              {isOver && (
                <p className="text-xs text-red-500">
                  Over budget by ₹{(b.spent - b.budgeted).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
