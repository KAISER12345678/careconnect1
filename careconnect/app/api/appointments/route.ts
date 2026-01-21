import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { generateSlotsUTC } from "@/lib/slots";

const Schema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startAt: z.string().datetime(),
  visitType: z.string().optional(),
});

export async function POST(req: Request) {
  const session = verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PATIENT") return NextResponse.json({ error: "Only patients can book" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const { doctorId, date, startAt, visitType } = parsed.data;

  const doctor = await prisma.doctorProfile.findFirst({
    where: { id: doctorId, provider: { status: "APPROVED" } },
    include: {
      availabilityRules: true,
      availabilityExceptions: true,
      appointments: { where: { status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } } },
    },
  });
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const slots = generateSlotsUTC({
    date,
    rules: doctor.availabilityRules,
    exceptions: doctor.availabilityExceptions,
    appointments: doctor.appointments,
    tzOffsetMinutes: Number(process.env.APP_TZ_OFFSET_MINUTES || 60),
  });

  const chosen = slots.find((s) => s.startAt.toISOString() === startAt);
  if (!chosen) return NextResponse.json({ error: "Slot unavailable" }, { status: 409 });

  const appointment = await prisma.appointment.create({
    data: {
      doctorId,
      patientId: session.id,
      startAt: chosen.startAt,
      endAt: chosen.endAt,
      status: "PENDING_CONFIRMATION",
      visitType: visitType || "in_person",
      priceAtBooking: doctor.priceMin,
    },
  });

  return NextResponse.json({ ok: true, appointment });
}
