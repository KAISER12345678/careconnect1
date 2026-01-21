import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const session = verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PROVIDER" && session.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const provider = await prisma.provider.findUnique({ where: { userId: session.id }, include: { doctorProfile: true } });
  if (!provider?.doctorProfile) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

  const appts = await prisma.appointment.findMany({
    where: { doctorId: provider.doctorProfile.id },
    orderBy: { startAt: "asc" },
    take: 100,
    include: { patient: { select: { name: true, phone: true } } },
  });

  return NextResponse.json({ ok: true, items: appts });
}
