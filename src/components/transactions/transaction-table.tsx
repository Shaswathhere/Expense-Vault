"use client";

import { format } from "date-fns";
import { getCurrencySymbol } from "@/lib/currencies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description?: string;
  date: string;
  currency: string;
}

interface Props {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TransactionTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  page,
  totalPages,
  onPageChange,
}: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Loading transactions...
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          No transactions found. Add your first one!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(t.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={t.type === "INCOME" ? "default" : "destructive"}
                      className={
                        t.type === "INCOME"
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : ""
                      }
                    >
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      t.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}{getCurrencySymbol(t.currency)}
                    {t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(t.id)}>
                          <Pencil className="mr-2 h-3 w-3" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(t.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    t.type === "INCOME"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {t.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(t.date), "MMM d")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    t.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}{getCurrencySymbol(t.currency)}
                  {t.amount.toLocaleString("en-IN")}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="h-7 w-7" />}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(t.id)}>
                      <Pencil className="mr-2 h-3 w-3" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(t.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
