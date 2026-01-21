import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const PatchSchema = z.object({
  action: z.enum(["CANCEL", "CONFIRM", "COMPLETE", "NO_SHOW"]),
});

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const appt = await prisma.appointment.findUnique({
    where: { id: ctx.params.id },
    include: { doctor: { include: { provider: true } } },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isPatientOwner = session.role === "PATIENT" && appt.patientId === session.id;
  const isProviderOwner = (session.role === "PROVIDER" || session.role === "ADMIN") && appt.doctor.provider.userId === session.id;
  const isAdmin = session.role === "ADMIN";

  const action = parsed.data.action;
  if (action === "CANCEL") {
    if (!isPatientOwner && !isProviderOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true, appointment: updated });
  }
  if (action === "CONFIRM") {
    if (!isProviderOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CONFIRMED" } });
    return NextResponse.json({ ok: true, appointment: updated });
  }
  if (action === "COMPLETE") {
    if (!isProviderOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status: "COMPLETED" } });
    return NextResponse.json({ ok: true, appointment: updated });
  }
  if (action === "NO_SHOW") {
    if (!isProviderOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status: "NO_SHOW" } });
    return NextResponse.json({ ok: true, appointment: updated });
  }

  return NextResponse.json({ error: "Unsupported" }, { status: 400 });
}
