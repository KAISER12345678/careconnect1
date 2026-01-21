import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const PatchSchema = z.object({
  providerId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function GET() {
  const session = verifySession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      doctorProfile: { select: { city: true, priceMin: true } },
      pharmacyProfile: { select: { city: true } },
    },
    take: 200,
  });

  return NextResponse.json({ ok: true, items: providers });
}

export async function PATCH(req: Request) {
  const session = verifySession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.provider.update({
    where: { id: parsed.data.providerId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true, provider: updated });
}
