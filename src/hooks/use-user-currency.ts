"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currencies";

export function useUserCurrency() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-currency"],
    queryFn: async () => {
      const res = await fetch("/api/users/currency");
      if (!res.ok) return { currency: DEFAULT_CURRENCY };
      return res.json();
    },
    staleTime: Infinity,
  });

  const currency: string = data?.currency || DEFAULT_CURRENCY;
  const symbol = getCurrencySymbol(currency);

  const updateMutation = useMutation({
    mutationFn: async (newCurrency: string) => {
      const res = await fetch("/api/users/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-currency"] });
    },
  });

  function format(amount: number): string {
    return `${symbol}${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return {
    currency,
    symbol,
    isLoading,
    format,
    updateCurrency: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
