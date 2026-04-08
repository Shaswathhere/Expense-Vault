"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Filters {
  type?: string;
  category?: string;
  from?: string;
  to?: string;
  page: number;
}

async function fetchTransactions(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page));
  params.set("limit", "15");

  const res = await fetch(`/api/transactions?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction deleted", {
        description: "The transaction has been removed.",
      });
    },
    onError: () =>
      toast.error("Delete failed", {
        description: "Could not delete the transaction. Try again.",
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your income and expenses
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} />

      <TransactionTable
        transactions={data?.transactions || []}
        isLoading={isLoading}
        onEdit={(id) => { setEditingId(id); setShowForm(true); }}
        onDelete={(id) => deleteMutation.mutate(id)}
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
      />

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); }}
        editId={editingId}
      />
    </div>
  );
}
