import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlotsUTC } from "@/lib/slots";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date=YYYY-MM-DD" }, { status: 400 });

  const doctor = await prisma.doctorProfile.findFirst({
    where: { id: ctx.params.id, provider: { status: "APPROVED" } },
    include: {
      availabilityRules: true,
      availabilityExceptions: true,
      appointments: {
        where: { status: { in: ["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED", "NO_SHOW"] } },
      },
    },
  });
  if (!doctor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slots = generateSlotsUTC({
    date,
    rules: doctor.availabilityRules,
    exceptions: doctor.availabilityExceptions,
    appointments: doctor.appointments,
    tzOffsetMinutes: Number(process.env.APP_TZ_OFFSET_MINUTES || 60),
  });

  return NextResponse.json({
    ok: true,
    date,
    slots: slots.map((s) => ({ startAt: s.startAt.toISOString(), endAt: s.endAt.toISOString() })),
  });
}
