import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const session = verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "PATIENT") return NextResponse.json({ ok: true, items: [] });

  const items = await prisma.appointment.findMany({
    where: { patientId: session.id },
    orderBy: { startAt: "desc" },
    take: 100,
    include: { doctor: { include: { provider: { include: { user: { select: { name: true } } } } } } },
  });

  return NextResponse.json({
    ok: true,
    items: items.map((a) => ({
      id: a.id,
      status: a.status,
      startAt: a.startAt,
      endAt: a.endAt,
      priceAtBooking: a.priceAtBooking,
      doctorName: a.doctor.provider.user.name,
      doctorId: a.doctorId,
    })),
  });
}
