import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id },
    orderBy: { category: "asc" },
  });

  return NextResponse.json(
    budgets.map((b) => ({ ...b, amount: Number(b.amount) }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const budget = await prisma.budget.upsert({
    where: {
      userId_category_period: {
        userId: session.user.id,
        category: parsed.data.category,
        period: parsed.data.period,
      },
    },
    update: { amount: parsed.data.amount },
    create: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json({ ...budget, amount: Number(budget.amount) }, { status: 201 });
}
