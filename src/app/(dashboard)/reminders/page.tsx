"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isPast } from "date-fns";
import { useUserCurrency } from "@/hooks/use-user-currency";

interface Reminder {
  id: string;
  title: string;
  amount: number | null;
  date: string;
  isDone: boolean;
}

export default function RemindersPage() {
  const queryClient = useQueryClient();
  const { symbol } = useUserCurrency();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["reminders"],
    queryFn: async () => {
      const res = await fetch("/api/reminders");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: amount ? Number(amount) : undefined,
          date,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder created", {
        description: `"${title}" set for ${new Date(date).toLocaleDateString()}.`,
      });
      setShowForm(false);
      setTitle("");
      setAmount("");
    },
    onError: (e: Error) =>
      toast.error("Failed to create reminder", { description: e.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isDone }: { id: string; isDone: boolean }) => {
      await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder deleted", {
        description: "The reminder has been removed.",
      });
    },
  });

  const pending = reminders.filter((r) => !r.isDone);
  const done = reminders.filter((r) => r.isDone);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Never miss a payment or bill
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Reminder
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : reminders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Bell className="mx-auto mb-4 h-10 w-10 opacity-50" />
            No reminders yet. Add one to stay on top of payments!
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Upcoming</h2>
              {pending.map((r) => {
                const dueDate = new Date(r.date);
                const overdue = isPast(dueDate) && !isToday(dueDate);
                return (
                  <Card key={r.id} className={overdue ? "border-red-500/50" : ""}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={r.isDone}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: r.id, isDone: !!checked })
                          }
                        />
                        <div>
                          <p className="font-medium">{r.title}</p>
                          <p className={`text-xs ${overdue ? "text-red-500" : "text-muted-foreground"}`}>
                            {overdue ? "Overdue" : isToday(dueDate) ? "Due today" : format(dueDate, "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.amount && (
                          <span className="font-medium">{symbol}{r.amount.toLocaleString()}</span>
                        )}
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
                );
              })}
            </div>
          )}

          {done.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Completed</h2>
              {done.map((r) => (
                <Card key={r.id} className="opacity-50">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={r.isDone}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: r.id, isDone: !!checked })
                        }
                      />
                      <p className="line-through">{r.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteMutation.mutate(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Pay rent" required />
            </div>
            <div className="space-y-2">
              <Label>Amount (optional)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Reminder
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
