"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  amount: number | null;
  date: string;
  isDone: boolean;
}

export function ReminderToasts({ reminders }: { reminders: Reminder[] }) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || reminders.length === 0) return;
    shown.current = true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdue = reminders.filter((r) => {
      const d = new Date(r.date);
      return d < today && !r.isDone;
    });

    const dueToday = reminders.filter((r) => {
      const d = new Date(r.date);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate() &&
        !r.isDone
      );
    });

    // Small delay so the page renders first
    const timer = setTimeout(() => {
      if (overdue.length > 0) {
        toast.error(`You have ${overdue.length} overdue reminder${overdue.length > 1 ? "s" : ""}`, {
          description: overdue.map((r) => `• ${r.title}${r.amount ? ` ($${r.amount})` : ""}`).join("\n"),
          duration: 8000,
          icon: <Bell className="h-4 w-4" />,
        });
      }

      if (dueToday.length > 0) {
        toast.warning(`${dueToday.length} reminder${dueToday.length > 1 ? "s" : ""} due today`, {
          description: dueToday.map((r) => `• ${r.title}${r.amount ? ` ($${r.amount})` : ""}`).join("\n"),
          duration: 8000,
          icon: <Bell className="h-4 w-4" />,
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [reminders]);

  return null;
}
