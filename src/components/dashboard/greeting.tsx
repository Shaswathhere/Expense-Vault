"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Flame, Lightbulb } from "lucide-react";

const tips = [
  "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
  "Review subscriptions monthly — cancel what you don't use.",
  "Cook at home twice more per week to save up to ₹3,000/month.",
  "Set up auto-transfers to savings on salary day.",
  "Track every small expense — ₹50 chai daily = ₹1,500/month.",
  "Use UPI cashback offers — small savings add up over time.",
  "Compare prices before buying electronics — wait for sales.",
  "Pack lunch for work 3 days a week — save ₹2,000+ monthly.",
  "Review your budgets at the start of each month.",
  "Avoid impulse purchases — wait 24 hours before buying.",
  "Negotiate your rent or bills annually — even 5% helps.",
  "Use public transport once a week to cut fuel costs.",
  "Unsubscribe from marketing emails to reduce impulse buys.",
  "Set a weekly spending limit and review every Sunday.",
  "Build an emergency fund worth 3 months of expenses.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDailyTip() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return tips[dayOfYear % tips.length];
}

export function DashboardGreeting({ streak }: { streak: number }) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const greeting = getGreeting();
  const tip = getDailyTip();

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {firstName}
        </h1>
        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            {tip}
          </span>
        </div>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400">
          <Flame className="h-4 w-4" />
          {streak} day streak
        </div>
      )}
    </div>
  );
}
