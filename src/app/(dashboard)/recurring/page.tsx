"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { useUserCurrency } from "@/hooks/use-user-currency";

interface RecurringTx {
  id: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  frequency: string;
  nextDue: string;
  isActive: boolean;
}

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [nextDue, setNextDue] = useState(new Date().toISOString().split("T")[0]);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const { symbol } = useUserCurrency();

  const { data: recurring = [], isLoading } = useQuery<RecurringTx[]>({
    queryKey: ["recurring"],
    queryFn: async () => {
      const res = await fetch("/api/recurring");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount: Number(amount), type, category, frequency, nextDue }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Recurring transaction added", {
        description: `${title} (${symbol}${Number(amount).toFixed(2)}) will repeat ${frequency.toLowerCase()}.`,
      });
      setShowForm(false);
      resetForm();
    },
    onError: (e: Error) =>
      toast.error("Failed to add recurring", { description: e.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await fetch(`/api/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Recurring deleted", {
        description: "The recurring transaction has been removed.",
      });
    },
  });

  function resetForm() {
    setTitle("");
    setAmount("");
    setCategory("");
    setType("EXPENSE");
    setFrequency("MONTHLY");
    setNextDue(new Date().toISOString().split("T")[0]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Track subscriptions and regular payments
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Recurring
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : recurring.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No recurring transactions. Add subscriptions and bills here!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recurring.map((r) => (
            <Card key={r.id} className={!r.isActive ? "opacity-50" : ""}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={r.isActive}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: r.id, isActive: checked })
                    }
                  />
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{r.category}</Badge>
                      <span>{r.frequency.toLowerCase()}</span>
                      <span>&middot; Next: {format(new Date(r.nextDue), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold ${
                      r.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {r.type === "INCOME" ? "+" : "-"}{symbol}{r.amount.toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Recurring Transaction</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={type === "EXPENSE" ? "default" : "outline"}
                className={type === "EXPENSE" ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => { setType("EXPENSE"); setCategory(""); }}
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={type === "INCOME" ? "default" : "outline"}
                className={type === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => { setType("INCOME"); setCategory(""); }}
              >
                Income
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Netflix" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount ({symbol})</Label>
                <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => v && setFrequency(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Due Date</Label>
              <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Recurring
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
