"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { useUserCurrency } from "@/hooks/use-user-currency";

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: string;
}

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("MONTHLY");
  const { symbol } = useUserCurrency();

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const res = await fetch("/api/budgets");
      return res.json();
    },
  });

  const { data: txData } = useQuery({
    queryKey: ["transactions", "current-month"],
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const res = await fetch(
        `/api/transactions?from=${from}&limit=1000&type=EXPENSE`
      );
      return res.json();
    },
  });

  const transactions = txData?.transactions || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount: Number(amount), period }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget saved", {
        description: `${symbol}${Number(amount).toLocaleString()} ${period.toLowerCase()} budget for ${category}.`,
      });
      setShowForm(false);
      setCategory("");
      setAmount("");
    },
    onError: (e: Error) =>
      toast.error("Failed to save budget", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget deleted", {
        description: "The budget has been removed.",
      });
    },
  });

  function getSpent(cat: string) {
    return transactions
      .filter((t: { category: string }) => t.category === cat)
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Set spending limits by category
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Set Budget
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No budgets set yet. Create one to start tracking!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const spent = getSpent(b.category);
            const pct = Math.min((spent / b.amount) * 100, 100);
            const isOver = spent > b.amount;
            return (
              <Card key={b.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{b.category}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(b.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={isOver ? "text-red-600 font-medium" : ""}>
                      {symbol}{spent.toLocaleString()} spent
                    </span>
                    <span className="text-muted-foreground">
                      of {symbol}{b.amount.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={
                      isOver
                        ? "[&>div]:bg-red-500"
                        : pct > 80
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-emerald-500"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {b.period.charAt(0) + b.period.slice(1).toLowerCase()} budget
                    {isOver && (
                      <span className="ml-1 text-red-500">
                        &middot; Over by {symbol}{(spent - b.amount).toLocaleString()}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Budget</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ({symbol})</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Budget
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
