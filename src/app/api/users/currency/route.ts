import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currency: true },
  });

  return NextResponse.json({ currency: user?.currency || "INR" });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currency } = await req.json();

  if (!currency || typeof currency !== "string") {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { currency },
  });

  return NextResponse.json({ currency });
}
