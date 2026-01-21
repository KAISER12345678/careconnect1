import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const p = await prisma.pharmacyProfile.findFirst({
    where: { id: ctx.params.id, provider: { status: "APPROVED" } },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, pharmacy: p });
}
