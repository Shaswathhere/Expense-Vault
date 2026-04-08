"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currencies";
import { useUserCurrency } from "@/hooks/use-user-currency";

interface Props {
  open: boolean;
  onClose: () => void;
  editId: string | null;
}

export function TransactionForm({ open, onClose, editId }: Props) {
  const queryClient = useQueryClient();
  const { currency: userCurrency } = useUserCurrency();
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState(userCurrency);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (editId && open) {
      fetch(`/api/transactions?page=1&limit=100`)
        .then((r) => r.json())
        .then((data) => {
          const tx = data.transactions?.find(
            (t: { id: string }) => t.id === editId
          );
          if (tx) {
            setType(tx.type);
            setTitle(tx.title);
            setAmount(String(tx.amount));
            setCategory(tx.category);
            setDate(new Date(tx.date).toISOString().split("T")[0]);
            setDescription(tx.description || "");
            setCurrency(tx.currency || userCurrency);
          }
        });
    } else if (!editId && open) {
      setType("EXPENSE");
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setCurrency(userCurrency);
    }
  }, [editId, open, userCurrency]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { title, amount: Number(amount), type, category, date, description, currency };
      const url = editId ? `/api/transactions/${editId}` : "/api/transactions";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      const sym = getCurrencySymbol(currency);
      toast.success(editId ? "Transaction updated" : "Transaction added", {
        description: editId
          ? "Your changes have been saved."
          : `${type === "INCOME" ? "Income" : "Expense"} of ${sym}${Number(amount).toFixed(2)} recorded.`,
      });
      onClose();
    },
    onError: (err: Error) =>
      toast.error("Failed to save transaction", { description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Grocery shopping"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount ({getCurrencySymbol(currency)})</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editId ? "Update" : "Add"} Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
