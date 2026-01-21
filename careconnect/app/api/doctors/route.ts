import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlotsUTC } from "@/lib/slots";

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const specialty = url.searchParams.get("specialty") || undefined; // slug
  const lang = url.searchParams.get("lang") || undefined;
  const minPrice = url.searchParams.get("minPrice") ? Number(url.searchParams.get("minPrice")) : undefined;
  const maxPrice = url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined;
  const lat = url.searchParams.get("lat") ? Number(url.searchParams.get("lat")) : undefined;
  const lng = url.searchParams.get("lng") ? Number(url.searchParams.get("lng")) : undefined;
  const radiusKm = url.searchParams.get("radiusKm") ? Number(url.searchParams.get("radiusKm")) : undefined;
  const page = url.searchParams.get("page") ? Math.max(1, Number(url.searchParams.get("page"))) : 1;
  const pageSize = url.searchParams.get("pageSize") ? Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize")))) : 20;

  const where: any = {
    provider: { status: "APPROVED" },
  };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (q) {
    where.OR = [
      { clinicName: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { provider: { user: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (minPrice != null || maxPrice != null) {
    where.priceMin = {};
    if (minPrice != null) where.priceMin.gte = minPrice;
    if (maxPrice != null) where.priceMin.lte = maxPrice;
  }
  if (lang) where.languages = { has: lang };

  if (specialty) {
    where.specialties = { some: { specialty: { slug: specialty } } };
  }

  const doctors = await prisma.doctorProfile.findMany({
    where,
    include: {
      provider: { include: { user: { select: { name: true } } } },
      specialties: { include: { specialty: true } },
      availabilityRules: true,
      availabilityExceptions: true,
      appointments: {
        where: { status: { in: ["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED", "NO_SHOW"] } },
        select: { startAt: true, endAt: true, status: true },
      },
      reviews: { where: { isHidden: false }, select: { rating: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Post-filter by distance if lat/lng provided
  const filtered = doctors
    .map((d) => {
      const distanceKm = lat != null && lng != null ? haversineKm(lat, lng, d.lat, d.lng) : null;
      const ratings = d.reviews.map((r) => r.rating);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

      // compute next available slot within 7 days (best effort)
      let nextAvailable: string | null = null;
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const dt = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
        const dateStr = dt.toISOString().slice(0, 10);
        const slots = generateSlotsUTC({
          date: dateStr,
          rules: d.availabilityRules,
          exceptions: d.availabilityExceptions,
          appointments: d.appointments as any,
          tzOffsetMinutes: Number(process.env.APP_TZ_OFFSET_MINUTES || 60),
        });
        if (slots.length) {
          nextAvailable = slots[0].startAt.toISOString();
          break;
        }
      }

      return {
        id: d.id,
        name: d.provider.user.name,
        clinicName: d.clinicName,
        city: d.city,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        priceMin: d.priceMin,
        currency: d.currencies || process.env.DEFAULT_CURRENCY || "MAD",
        languages: d.languages,
        specialties: d.specialties.map((s) => ({ id: s.specialty.id, name: s.specialty.name, slug: s.specialty.slug })),
        avgRating,
        ratingCount: ratings.length,
        distanceKm,
        nextAvailable,
      };
    })
    .filter((d) => {
      if (radiusKm != null && d.distanceKm != null) return d.distanceKm <= radiusKm;
      return true;
    });

  return NextResponse.json({ ok: true, page, pageSize, items: filtered });
}
