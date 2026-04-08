import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  isPaid: z.boolean(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Only the creator can mark members as paid
  const group = await prisma.splitGroup.findFirst({
    where: { id, creatorId: session.user.id },
  });

  if (!group) {
    return NextResponse.json(
      { error: "Only the person who created this split can mark payments" },
      { status: 403 }
    );
  }

  const member = await prisma.splitGroupMember.update({
    where: { id: parsed.data.memberId },
    data: { isPaid: parsed.data.isPaid },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  // Notify the member who was marked as paid/unpaid
  if (parsed.data.isPaid) {
    // Notify the person who was marked as paid
    await prisma.notification.create({
      data: {
        userId: member.user.id,
        type: "split_paid",
        title: "Payment confirmed",
        message: `Your payment of ₹${Number(member.share).toFixed(2)} for "${group.name}" has been confirmed.`,
      },
    });

    // Notify other members
    const allMembers = await prisma.splitGroupMember.findMany({
      where: { splitGroupId: id },
      select: { userId: true },
    });

    const othersToNotify = allMembers
      .filter((m) => m.userId !== member.user.id && m.userId !== session.user!.id)
      .map((m) => m.userId);

    if (othersToNotify.length > 0) {
      await prisma.notification.createMany({
        data: othersToNotify.map((uid) => ({
          userId: uid,
          type: "split_paid",
          title: "Split payment update",
          message: `${member.user.name} paid ₹${Number(member.share).toFixed(2)} for "${group.name}"`,
        })),
      });
    }
  }

  return NextResponse.json({ ...member, share: Number(member.share) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Only creator or members can delete
  const group = await prisma.splitGroup.findFirst({
    where: {
      id,
      OR: [
        { creatorId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.splitGroup.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
