"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, User, Globe, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";
import { useUserCurrency } from "@/hooks/use-user-currency";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { currency, symbol, updateCurrency, isUpdating } = useUserCurrency();
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function handleCurrencyChange(code: string) {
    try {
      await updateCurrency(code);
      const curr = CURRENCIES.find((c) => c.code === code);
      toast.success("Currency updated", {
        description: `Default currency set to ${curr?.name || code} (${curr?.symbol || code}).`,
      });
    } catch {
      toast.error("Failed to update currency");
    }
  }

  async function handleExportCSV() {
    try {
      const res = await fetch("/api/transactions?limit=10000");
      const data = await res.json();

      if (!data.transactions?.length) {
        toast.warning("No data to export", {
          description: "Add some transactions first.",
        });
        return;
      }

      const headers = ["Title", "Amount", "Currency", "Type", "Category", "Date", "Description"];
      const rows = data.transactions.map(
        (t: {
          title: string;
          amount: number;
          currency: string;
          type: string;
          category: string;
          date: string;
          description?: string;
        }) => [
          t.title,
          t.amount,
          t.currency,
          t.type,
          t.category,
          new Date(t.date).toLocaleDateString(),
          t.description || "",
        ]
      );

      const csv = [headers, ...rows].map((r) => r.map((c: string | number) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-vault-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!", {
        description: `${data.transactions.length} transactions downloaded.`,
      });
    } catch {
      toast.error("Export failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  }

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    try {
      const res = await fetch(`/api/export/report?month=${reportMonth}`);
      if (!res.ok) {
        toast.error("Failed to fetch report data");
        return;
      }
      const data = await res.json();

      if (!data.transactions?.length) {
        toast.warning("No transactions found", {
          description: "There are no transactions for the selected month.",
        });
        return;
      }

      const [yearStr, monStr] = reportMonth.split("-");
      const monthName = new Date(Number(yearStr), Number(monStr) - 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Expense Vault - Monthly Report", pageWidth / 2, 20, { align: "center" });

      // Month header
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(monthName, pageWidth / 2, 30, { align: "center" });

      // Summary box
      let y = 42;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, y - 6, pageWidth - 28, 30, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 20, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total Income: ${symbol}${data.totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 20, y);
      doc.text(`Total Expenses: ${symbol}${data.totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 90, y);
      y += 8;
      const balColor = data.balance >= 0 ? [34, 139, 34] : [220, 20, 60];
      doc.setTextColor(balColor[0], balColor[1], balColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(`Net Balance: ${symbol}${data.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 20, y);
      doc.setTextColor(0, 0, 0);

      // Category breakdown table
      y += 14;
      if (data.categoryBreakdown.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Category Breakdown", 14, y);
        y += 2;
        autoTable(doc, {
          startY: y,
          head: [["Category", `Amount (${symbol})`]],
          body: data.categoryBreakdown.map((c: { category: string; amount: number }) => [
            c.category,
            c.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable?.finalY ?? y;
      }

      // Top 5 expenses
      y += 10;
      if (data.topExpenses.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Top 5 Expenses", 14, y);
        y += 2;
        autoTable(doc, {
          startY: y,
          head: [["Title", `Amount (${symbol})`, "Category", "Date"]],
          body: data.topExpenses.map((e: { title: string; amount: number; category: string; date: string }) => [
            e.title,
            e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            e.category,
            new Date(e.date).toLocaleDateString(),
          ]),
          theme: "striped",
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 14, right: 14 },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable?.finalY ?? y;
      }

      // Full transaction list
      y += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("All Transactions", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Title", "Type", `Amount (${symbol})`, "Category", "Date"]],
        body: data.transactions.map(
          (t: { title: string; type: string; amount: number; category: string; date: string }) => [
            t.title,
            t.type,
            t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            t.category,
            new Date(t.date).toLocaleDateString(),
          ]
        ),
        theme: "striped",
        headStyles: { fillColor: [107, 114, 128] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      // Footer
      const pageCount = (doc as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.setTextColor(0, 0, 0);
      }

      doc.save(`expense-vault-report-${reportMonth}.pdf`);
      toast.success("PDF report generated!", {
        description: `Report for ${monthName} downloaded.`,
      });
    } catch {
      toast.error("Failed to generate report", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-1">Free Plan</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency
          </CardTitle>
          <CardDescription>
            Choose your default currency. This applies to all transactions, budgets, and displays across the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={currency}
            onValueChange={(v) => v && handleCurrencyChange(v)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="font-medium">{c.symbol}</span>
                  <span className="ml-2">{c.code}</span>
                  <span className="ml-1 text-muted-foreground">— {c.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export as CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Report
          </CardTitle>
          <CardDescription>
            Generate a PDF report for any month with income, expenses, category breakdown, and transaction details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <label htmlFor="report-month" className="text-sm font-medium">
                Select Month
              </label>
              <Input
                id="report-month"
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="w-full sm:w-52"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
            >
              <FileText className="mr-2 h-4 w-4" />
              {generatingPdf ? "Generating..." : "Generate PDF Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <p className="mb-3 text-sm text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
          <Button variant="destructive" disabled>
            Delete Account (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
