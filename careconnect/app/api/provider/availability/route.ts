import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const CreateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.number().int().min(10).max(120).default(20),
});

export async function GET() {
  const session = verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PROVIDER" && session.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const provider = await prisma.provider.findUnique({
    where: { userId: session.id },
    include: { doctorProfile: { include: { availabilityRules: true } } },
  });
  if (!provider?.doctorProfile) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

  return NextResponse.json({ ok: true, rules: provider.doctorProfile.availabilityRules });
}

export async function POST(req: Request) {
  const session = verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PROVIDER" && session.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const provider = await prisma.provider.findUnique({ where: { userId: session.id }, include: { doctorProfile: true } });
  if (!provider?.doctorProfile) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

  const rule = await prisma.availabilityRule.create({
    data: {
      doctorId: provider.doctorProfile.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      slotMinutes: parsed.data.slotMinutes,
    },
  });

  return NextResponse.json({ ok: true, rule });
}
