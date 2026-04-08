"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Wallet,
  BarChart3,
  Bell,
  Shield,
  Repeat,
  Brain,
  Globe,
  Users,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  PiggyBank,
  MessageSquarePlus,
  FileText,
  Flame,
  BellRing,
  Activity,
  Moon,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Smart Dashboard",
    description:
      "Sparkline trends, balance area chart, spending heatmap, category donut chart, and budget progress — all in one view.",
  },
  {
    icon: MessageSquarePlus,
    title: "Quick Add (NLP)",
    description:
      "Type naturally like 'Spent 450 on swiggy dinner' and AI parses it into the right transaction, reminder, or budget.",
  },
  {
    icon: Brain,
    title: "AI Insights",
    description:
      "Groq-powered spending analysis with structured markdown reports — savings tips, health score, and action items.",
  },
  {
    icon: PiggyBank,
    title: "Budget Goals",
    description:
      "Set monthly budgets per category with color-coded progress bars and over-budget alerts.",
  },
  {
    icon: Users,
    title: "Split Expenses",
    description:
      "Split bills with friends via user search. Auto-includes you, tracks who paid, and sends toast notifications.",
  },
  {
    icon: Repeat,
    title: "Recurring Transactions",
    description:
      "Track subscriptions like Netflix, Spotify, rent with enable/disable toggle and next-due tracking.",
  },
  {
    icon: BellRing,
    title: "Smart Reminders",
    description:
      "Set payment reminders and get toast alerts for overdue and due-today items on every page load.",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    description:
      "13 currencies with INR default. Set your preference in settings — applies across all pages and forms.",
  },
  {
    icon: FileText,
    title: "PDF Reports",
    description:
      "Generate downloadable monthly PDF reports with income/expense summary, category breakdown, and transaction list.",
  },
  {
    icon: Activity,
    title: "Advanced Visualizations",
    description:
      "GitHub-style spending heatmap, cumulative balance area chart, and sparkline mini-trends in overview cards.",
  },
  {
    icon: Flame,
    title: "Streaks & Tips",
    description:
      "Daily money-saving tips and a fire streak counter that tracks consecutive days of expense logging.",
  },
  {
    icon: Moon,
    title: "Dark Mode + PWA",
    description:
      "Beautiful emerald theme with system-aware dark mode. Installable as a PWA with offline draft support.",
  },
];

const stats = [
  { value: "100%", label: "Free to use", numericValue: 100, suffix: "%" },
  { value: "256-bit", label: "Encryption", numericValue: 256, suffix: "-bit" },
  { value: "Real-time", label: "Sync", numericValue: null, suffix: null },
  { value: "24/7", label: "Access", numericValue: 24, suffix: "/7" },
];

function AnimatedCounter({
  value,
  numericValue,
  suffix,
}: {
  value: string;
  numericValue: number | null;
  suffix: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isInView || numericValue === null) return;

    let start = 0;
    const end = numericValue;
    const duration = 1500;
    const stepTime = duration / end;
    const timer = setInterval(() => {
      start += Math.max(1, Math.floor(end / 60));
      if (start >= end) {
        start = end;
        clearInterval(timer);
        setDone(true);
      }
      setCount(start);
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, numericValue]);

  if (numericValue === null) {
    return (
      <motion.div
        ref={ref}
        className="text-2xl font-bold"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {value}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className="text-2xl font-bold">
      {isInView ? (done ? numericValue : count) : 0}
      {suffix}
    </div>
  );
}

const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeUpScale = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const },
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            Expense Vault
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />
        <motion.div
          className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-32"
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm"
            variants={fadeUpScale}
          >
            <TrendingUp className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            Smart finance management for everyone
          </motion.div>
          <motion.h1
            className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
            variants={fadeUpScale}
          >
            Take control of your{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              finances
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
            variants={fadeUpScale}
          >
            Track expenses, set budgets, get AI-powered insights, and split bills
            with friends. All in one beautiful, secure app.
          </motion.p>
          <motion.div
            className="mt-10 flex items-center justify-center gap-4"
            variants={fadeUpScale}
          >
            <Button size="lg" asChild>
              <Link href="/signup">
                Start for free <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See features</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <AnimatedCounter
                  value={stat.value}
                  numericValue={stat.numericValue}
                  suffix={stat.suffix}
                />
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Dashboard Preview */}
      <motion.section
        className="mx-auto max-w-5xl px-4 pb-16"
        initial={{ opacity: 0, y: 80, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
      >
        <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-muted-foreground">Expense Vault Dashboard</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6">
            <div className="rounded-lg bg-emerald-500/10 p-4">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">₹86,500</p>
              <p className="text-xs text-emerald-600">+12% from last month</p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-4">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">₹42,300</p>
              <p className="text-xs text-red-600">-5% from last month</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-4">
              <p className="text-sm text-muted-foreground">Net Savings</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">₹44,200</p>
              <p className="text-xs text-blue-600">+28% from last month</p>
            </div>
            <div className="sm:col-span-2 flex h-32 items-end gap-1 rounded-lg border p-4">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-emerald-500/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              {["Food", "Transport", "Shopping", "Bills"].map((cat, i) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">{[32, 18, 25, 15][i]}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">Everything you need</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features to help you master your money
            </p>
          </motion.div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0, 0, 0.2, 1],
                }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <motion.section
        className="border-t py-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      >
        <div className="mx-auto max-w-2xl px-4 text-center">
          <Shield className="mx-auto mb-6 h-12 w-12 text-emerald-500" />
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to take control?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of users who are already managing their finances smarter.
            It&apos;s free to get started.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/signup">
              Create free account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Expense Vault
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Expense Vault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
