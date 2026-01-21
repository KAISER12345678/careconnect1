import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const Schema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(3).max(2000),
});

export async function POST(req: Request) {
  const session = verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const appt = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId } });
  if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  if (session.role !== "PATIENT" || appt.patientId !== session.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (appt.status !== "COMPLETED") return NextResponse.json({ error: "You can review only after completion" }, { status: 409 });

  const existing = await prisma.review.findUnique({ where: { appointmentId: appt.id } });
  if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  const review = await prisma.review.create({
    data: {
      appointmentId: appt.id,
      doctorId: appt.doctorId,
      patientId: appt.patientId,
      rating: parsed.data.rating,
      text: parsed.data.text,
    },
  });

  return NextResponse.json({ ok: true, review });
}
