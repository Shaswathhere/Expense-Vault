import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recurringTransactionSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { nextDue: "asc" },
  });

  return NextResponse.json(
    recurring.map((r) => ({ ...r, amount: Number(r.amount) }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = recurringTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const recurring = await prisma.recurringTransaction.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(
    { ...recurring, amount: Number(recurring.amount) },
    { status: 201 }
  );
}
