import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const PatchSchema = z.object({
  reviewId: z.string().min(1),
  isHidden: z.boolean(),
});

export async function GET() {
  const session = verifySession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { doctor: { include: { provider: { include: { user: { select: { name: true } } } } } }, patient: { select: { name: true } } },
  });

  return NextResponse.json({ ok: true, items: reviews });
}

export async function PATCH(req: Request) {
  const session = verifySession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.review.update({ where: { id: parsed.data.reviewId }, data: { isHidden: parsed.data.isHidden } });

  return NextResponse.json({ ok: true, review: updated });
}
