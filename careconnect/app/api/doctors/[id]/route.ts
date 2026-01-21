import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;

  const doctor = await prisma.doctorProfile.findFirst({
    where: { id, provider: { status: "APPROVED" } },
    include: {
      provider: { include: { user: { select: { name: true, email: true } } } },
      specialties: { include: { specialty: true } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { patient: { select: { name: true } } },
      },
    },
  });

  if (!doctor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ratings = doctor.reviews.map((r) => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return NextResponse.json({
    ok: true,
    doctor: {
      id: doctor.id,
      name: doctor.provider.user.name,
      clinicName: doctor.clinicName,
      bio: doctor.bio,
      address: doctor.address,
      city: doctor.city,
      lat: doctor.lat,
      lng: doctor.lng,
      priceMin: doctor.priceMin,
      currency: doctor.currencies || process.env.DEFAULT_CURRENCY || "MAD",
      languages: doctor.languages,
      photos: doctor.photos,
      specialties: doctor.specialties.map((s) => ({ id: s.specialty.id, name: s.specialty.name, slug: s.specialty.slug })),
      avgRating,
      ratingCount: ratings.length,
      reviews: doctor.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        patientName: r.patient.name,
      })),
    },
  });
}
