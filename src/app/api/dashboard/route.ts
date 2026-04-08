import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Single parallel fetch for everything
  const [
    thisMonthTx,
    lastMonthTx,
    budgets,
    recentTx,
    allSixMonthTx,
    reminders,
    notifications,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
    }),
    prisma.reminder.findMany({
      where: { userId, isDone: false },
      orderBy: { date: "asc" },
    }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalIncome = thisMonthTx
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = thisMonthTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);
  const lastMonthIncome = lastMonthTx
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const lastMonthExpenses = lastMonthTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);

  const categoryData: Record<string, number> = {};
  thisMonthTx
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
    });

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.toLocaleString("default", { month: "short" }), income: 0, expenses: 0 };
  });

  allSixMonthTx.forEach((t) => {
    const m = new Date(t.date).toLocaleString("default", { month: "short" });
    const entry = monthlyData.find((e) => e.month === m);
    if (entry) {
      if (t.type === "INCOME") entry.income += Number(t.amount);
      else entry.expenses += Number(t.amount);
    }
  });

  const budgetData = budgets.map((b) => ({
    category: b.category,
    budgeted: Number(b.amount),
    spent: thisMonthTx
      .filter((t) => t.type === "EXPENSE" && t.category === b.category)
      .reduce((s, t) => s + Number(t.amount), 0),
  }));

  // Calculate logging streak (consecutive days with transactions)
  const txDates = new Set(
    allSixMonthTx.map((t) => t.date.toISOString().split("T")[0])
  );
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (txDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Daily spending data for heatmap (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dailySpending: Record<string, number> = {};
  allSixMonthTx
    .filter((t) => t.type === "EXPENSE" && new Date(t.date) >= ninetyDaysAgo)
    .forEach((t) => {
      const day = t.date.toISOString().split("T")[0];
      dailySpending[day] = (dailySpending[day] || 0) + Number(t.amount);
    });

  // Balance over time (cumulative for area chart)
  const balanceOverTime = monthlyData.map((m) => ({
    ...m,
    balance: m.income - m.expenses,
  }));
  let cumBalance = 0;
  balanceOverTime.forEach((m) => {
    cumBalance += m.balance;
    m.balance = cumBalance;
  });

  return NextResponse.json({
    overview: { totalIncome, totalExpenses, lastMonthIncome, lastMonthExpenses },
    streak,
    dailySpending,
    balanceOverTime,
    categoryData,
    monthlyData,
    budgetData,
    recentTransactions: recentTx.map((t) => ({
      id: t.id,
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      date: t.date.toISOString(),
      currency: t.currency,
    })),
    reminders: reminders.map((r) => ({
      id: r.id,
      title: r.title,
      amount: r.amount ? Number(r.amount) : null,
      date: r.date.toISOString(),
      isDone: r.isDone,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
