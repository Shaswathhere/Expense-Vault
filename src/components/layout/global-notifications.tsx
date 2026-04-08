"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Users } from "lucide-react";

export function GlobalNotifications() {
  const shown = useRef(false);

  const { data } = useQuery({
    queryKey: ["global-notifications"],
    queryFn: async () => {
      const [notifRes, remRes] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/reminders"),
      ]);
      return {
        notifications: notifRes.ok
          ? ((await notifRes.json()) as { id: string; type: string; title: string; message: string }[])
          : [],
        reminders: remRes.ok
          ? ((await remRes.json()) as { id: string; title: string; amount: number | null; date: string; isDone: boolean }[])
          : [],
      };
    },
    staleTime: Infinity,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (shown.current || !data) return;
    const { notifications, reminders } = data;
    if (notifications.length === 0 && reminders.length === 0) return;
    shown.current = true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdue = reminders.filter((r) => new Date(r.date) < today && !r.isDone);
    const dueToday = reminders.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate() && !r.isDone;
    });

    setTimeout(() => {
      if (overdue.length > 0) {
        toast.error(`${overdue.length} overdue reminder${overdue.length > 1 ? "s" : ""}`, {
          description: overdue.slice(0, 3).map((r) => `• ${r.title}`).join("\n"),
          duration: 8000,
          icon: <Bell className="h-4 w-4" />,
        });
      }

      if (dueToday.length > 0) {
        toast.warning(`${dueToday.length} reminder${dueToday.length > 1 ? "s" : ""} due today`, {
          description: dueToday.slice(0, 3).map((r) => `• ${r.title}`).join("\n"),
          duration: 8000,
          icon: <Bell className="h-4 w-4" />,
        });
      }

      for (const n of notifications) {
        const icon = n.type.startsWith("split")
          ? <Users className="h-4 w-4" />
          : <Bell className="h-4 w-4" />;

        if (n.type === "split_invite") {
          toast.info(n.title, { description: n.message, duration: 6000, icon });
        } else if (n.type === "split_paid") {
          toast.success(n.title, { description: n.message, duration: 5000, icon });
        } else {
          toast(n.title, { description: n.message, duration: 5000 });
        }
      }

      if (notifications.length > 0) {
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: notifications.map((n) => n.id) }),
        });
      }
    }, 1500);
  }, [data]);

  return null;
}
