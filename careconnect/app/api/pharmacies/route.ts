import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city") || undefined;
  const q = url.searchParams.get("q") || undefined;

  const where: any = { provider: { status: "APPROVED" } };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { services: { has: q } },
    ];
  }

  const items = await prisma.pharmacyProfile.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    items: items.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      phone: p.phone,
      hours: p.hours,
      services: p.services,
      photo: p.photo,
    })),
  });
}
