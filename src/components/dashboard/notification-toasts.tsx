"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationToasts({
  notifications,
}: {
  notifications: Notification[];
}) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || notifications.length === 0) return;
    shown.current = true;

    const timer = setTimeout(async () => {
      for (const n of notifications) {
        if (n.type === "split_invite") {
          toast.info(n.title, {
            description: n.message,
            duration: 6000,
            icon: <Users className="h-4 w-4" />,
          });
        } else if (n.type === "split_paid") {
          toast.success(n.title, {
            description: n.message,
            duration: 5000,
            icon: <Users className="h-4 w-4" />,
          });
        } else {
          toast(n.title, {
            description: n.message,
            duration: 5000,
          });
        }
      }

      // Mark all as read
      const ids = notifications.map((n) => n.id);
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [notifications]);

  return null;
}
