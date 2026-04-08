"use client";

import { useQuery } from "@tanstack/react-query";
import { convertCurrency, type ExchangeRates } from "@/lib/currencies";
import { useCallback } from "react";

export function useCurrency() {
  const {
    data: exchangeRates,
    isLoading,
    error,
  } = useQuery<ExchangeRates>({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const res = await fetch("/api/exchange-rates");
      if (!res.ok) throw new Error("Failed to fetch exchange rates");
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  const convert = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (!exchangeRates?.rates) return amount;
      return convertCurrency(amount, fromCurrency, toCurrency, exchangeRates.rates);
    },
    [exchangeRates]
  );

  const formatCurrency = useCallback(
    (amount: number, currencyCode: string): string => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    []
  );

  return {
    exchangeRates,
    isLoading,
    error,
    convert,
    formatCurrency,
  };
}
