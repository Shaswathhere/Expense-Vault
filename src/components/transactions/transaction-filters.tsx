"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

interface Filters {
  type?: string;
  category?: string;
  from?: string;
  to?: string;
  page: number;
}

export function TransactionFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
  const hasFilters = filters.type || filters.category || filters.from || filters.to;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 pt-4">
        <Select
          value={filters.type || "all"}
          onValueChange={(v) =>
            v && onChange({ ...filters, type: v === "all" ? undefined : v, page: 1 })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category || "all"}
          onValueChange={(v) =>
            v && onChange({ ...filters, category: v === "all" ? undefined : v, page: 1 })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="From"
          value={filters.from || ""}
          onChange={(e) =>
            onChange({ ...filters, from: e.target.value || undefined, page: 1 })
          }
          className="w-[160px]"
        />
        <Input
          type="date"
          placeholder="To"
          value={filters.to || ""}
          onChange={(e) =>
            onChange({ ...filters, to: e.target.value || undefined, page: 1 })
          }
          className="w-[160px]"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ page: 1 })}
          >
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
