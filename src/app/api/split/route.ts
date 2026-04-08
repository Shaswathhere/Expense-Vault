import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const memberSchema = z.object({
  email: z.string().email("Invalid email address"),
  share: z.number().positive("Share must be positive"),
});

const createSplitGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  members: z.array(memberSchema).min(1, "At least one member is required"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.splitGroup.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      transactions: {
        select: { id: true, title: true, amount: true, date: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = groups.map((g) => ({
    ...g,
    totalAmount: Number(g.totalAmount),
    members: g.members.map((m) => ({
      ...m,
      share: Number(m.share),
    })),
    transactions: g.transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    })),
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSplitGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, totalAmount, members } = parsed.data;

  // Resolve member emails to user IDs
  const userEmails = members.map((m) => m.email);
  const users = await prisma.user.findMany({
    where: { email: { in: userEmails } },
    select: { id: true, email: true },
  });

  const emailToId = new Map(users.map((u) => [u.email, u.id]));

  // Check all emails exist
  const missing = userEmails.filter((e) => !emailToId.has(e));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Users not found: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Auto-include the creator if not already in the list
  const creatorId = session.user!.id;
  const creatorAlreadyIncluded = members.some(
    (m) => emailToId.get(m.email) === creatorId
  );

  // Build all member records: friends + creator
  const allMemberRecords = members.map((m) => ({
    userId: emailToId.get(m.email)!,
    share: m.share,
    isPaid: emailToId.get(m.email) === creatorId,
  }));

  if (!creatorAlreadyIncluded) {
    // Creator's share = same as each member for equal splits
    // For custom splits, creator's share = totalAmount - sum of others
    const othersTotal = members.reduce((sum, m) => sum + m.share, 0);
    const creatorShare = totalAmount - othersTotal;

    allMemberRecords.push({
      userId: creatorId,
      share: creatorShare > 0 ? creatorShare : members[0].share,
      isPaid: true, // Creator already paid
    });
  }

  const group = await prisma.splitGroup.create({
    data: {
      name,
      totalAmount,
      creatorId,
      members: {
        create: allMemberRecords,
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      transactions: true,
    },
  });

  // Create notifications for all members except the creator
  const creatorUser = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { name: true, currency: true },
  });

  const symbol = creatorUser?.currency === "INR" ? "₹" : "$";

  const friendMembers = allMemberRecords.filter(
    (m) => m.userId !== creatorId
  );

  if (friendMembers.length > 0) {
    await prisma.notification.createMany({
      data: friendMembers.map((m) => ({
        userId: m.userId,
        type: "split_invite",
        title: "Added to a split",
        message: `${creatorUser?.name || "Someone"} added you to "${name}" — your share is ${symbol}${m.share.toFixed(2)}`,
      })),
    });
  }

  return NextResponse.json(
    {
      ...group,
      totalAmount: Number(group.totalAmount),
      members: group.members.map((m) => ({
        ...m,
        share: Number(m.share),
      })),
    },
    { status: 201 }
  );
}
