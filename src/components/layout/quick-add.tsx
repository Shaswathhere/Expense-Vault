"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquarePlus,
  X,
  Loader2,
  Send,
  Check,
  Pencil,
  ArrowLeftRight,
  Bell,
  PiggyBank,
  Repeat,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useUserCurrency } from "@/hooks/use-user-currency";

interface ParsedResult {
  action: "transaction" | "reminder" | "budget" | "recurring";
  type?: "INCOME" | "EXPENSE";
  title: string;
  amount: number;
  category: string;
  date: string;
  frequency?: string;
  period?: string;
  confidence: number;
  original: string;
}

const actionConfig = {
  transaction: { label: "Transaction", icon: ArrowLeftRight, color: "text-blue-600", bg: "bg-blue-500/10" },
  reminder: { label: "Reminder", icon: Bell, color: "text-amber-600", bg: "bg-amber-500/10" },
  budget: { label: "Budget", icon: PiggyBank, color: "text-purple-600", bg: "bg-purple-500/10" },
  recurring: { label: "Recurring", icon: Repeat, color: "text-teal-600", bg: "bg-teal-500/10" },
};

const examples = [
  "Spent 450 on swiggy dinner",
  "Got salary 88000 on 28th",
  "Remind me to pay rent 16000 on 1st",
  "Netflix 649 every month",
  "Set food budget to 8000",
  "Uber ride 280 today",
];

export function QuickAdd() {
  const queryClient = useQueryClient();
  const { symbol } = useUserCurrency();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // Keyboard shortcut: Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
        resetState();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function resetState() {
    setInput("");
    setResult(null);
    setConfirming(false);
  }

  async function handleParse() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      toast.error("Couldn't understand that", {
        description: err instanceof Error ? err.message : "Try rephrasing",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!result) return;
    setConfirming(true);

    try {
      let url = "";
      let body: Record<string, unknown> = {};

      switch (result.action) {
        case "transaction":
          url = "/api/transactions";
          body = {
            title: result.title,
            amount: result.amount,
            type: result.type || "EXPENSE",
            category: result.category,
            date: result.date,
            description: `Added via Quick Add: "${result.original}"`,
          };
          break;

        case "reminder":
          url = "/api/reminders";
          body = {
            title: result.title,
            amount: result.amount > 0 ? result.amount : undefined,
            date: result.date,
          };
          break;

        case "budget":
          url = "/api/budgets";
          body = {
            category: result.category,
            amount: result.amount,
            period: result.period || "MONTHLY",
          };
          break;

        case "recurring":
          url = "/api/recurring";
          body = {
            title: result.title,
            amount: result.amount,
            type: result.type || "EXPENSE",
            category: result.category,
            frequency: result.frequency || "MONTHLY",
            nextDue: result.date,
          };
          break;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const actionLabel = actionConfig[result.action].label;
      toast.success(`${actionLabel} added!`, {
        description: `${result.title} — ${symbol}${result.amount.toLocaleString()}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["recurring"] });

      resetState();
      setOpen(false);
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            className="fixed bottom-20 right-6 z-40"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Button
              onClick={() => setOpen(true)}
              className="h-10 rounded-full shadow-lg hover:shadow-xl gap-2 px-4"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Quick Add</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); resetState(); }}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-6 z-50 sm:w-[400px]"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <Card className="shadow-2xl border-primary/20">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Quick Add</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Ctrl+K
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setOpen(false); resetState(); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleParse();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setResult(null); }}
                      placeholder="Type naturally... e.g., 'Spent 500 on uber'"
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={loading || !input.trim()}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>

                  {/* Examples */}
                  {!result && !loading && (
                    <div className="mt-3">
                      <p className="text-[11px] text-muted-foreground mb-2">Try something like:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {examples.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => { setInput(ex); setResult(null); }}
                            className="rounded-full border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loading */}
                  {loading && (
                    <div className="mt-4 flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Understanding your input...
                    </div>
                  )}

                  {/* Result Preview */}
                  {result && !loading && (
                    <motion.div
                      className="mt-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Separator className="mb-3" />

                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
                        {/* Action badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const config = actionConfig[result.action];
                              const Icon = config.icon;
                              return (
                                <div className={`flex items-center gap-1.5 rounded-full ${config.bg} px-2.5 py-1`}>
                                  <Icon className={`h-3 w-3 ${config.color}`} />
                                  <span className={`text-xs font-medium ${config.color}`}>
                                    {config.label}
                                  </span>
                                </div>
                              );
                            })()}
                            {result.type && (
                              <Badge
                                variant={result.type === "INCOME" ? "default" : "destructive"}
                                className={
                                  result.type === "INCOME"
                                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs"
                                    : "text-xs"
                                }
                              >
                                {result.type}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round(result.confidence * 100)}% confident
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{result.title}</span>
                            <span className="text-sm font-bold">
                              {result.type === "INCOME" ? "+" : ""}{symbol}{result.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {result.category && (
                              <span>Category: <strong className="text-foreground">{result.category}</strong></span>
                            )}
                            {result.date && (
                              <span>Date: <strong className="text-foreground">
                                {new Date(result.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </strong></span>
                            )}
                            {result.frequency && (
                              <span>Frequency: <strong className="text-foreground">{result.frequency.toLowerCase()}</strong></span>
                            )}
                            {result.period && (
                              <span>Period: <strong className="text-foreground">{result.period.toLowerCase()}</strong></span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={handleConfirm}
                            disabled={confirming}
                          >
                            {confirming ? (
                              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="mr-1.5 h-3 w-3" />
                            )}
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setResult(null); inputRef.current?.focus(); }}
                          >
                            <Pencil className="mr-1.5 h-3 w-3" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
