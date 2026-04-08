import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // e.g. "2026-04"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month format. Use YYYY-MM." },
      { status: 400 }
    );
  }

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 1, 1);
  const endDate = new Date(year, mon, 1); // first day of next month

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: { date: "desc" },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryMap: Record<string, number> = {};

  for (const t of transactions) {
    const amount = Number(t.amount);
    if (t.type === "INCOME") {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }

    if (t.type === "EXPENSE") {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + amount;
    }
  }

  const balance = totalIncome - totalExpenses;

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const topExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map((t) => ({
      title: t.title,
      amount: Number(t.amount),
      category: t.category,
      date: t.date,
    }));

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
      currency: t.currency,
    })),
    totalIncome,
    totalExpenses,
    balance,
    categoryBreakdown,
    topExpenses,
  });
}
