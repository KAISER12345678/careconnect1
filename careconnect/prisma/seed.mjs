import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Specialties
  const specialties = [
    { name: "Dermatology", slug: "derm" },
    { name: "Dentistry", slug: "dentist" },
    { name: "General Practitioner", slug: "gp" },
    { name: "Pediatrics", slug: "peds" },
  ];

  for (const s of specialties) {
    await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: { name: s.name },
      create: s,
    });
  }

  // Admin user
  const adminEmail = "admin@careconnect.local";
  const adminPass = "admin12345";
  const adminHash = await bcrypt.hash(adminPass, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, name: "Admin", role: "ADMIN" },
    create: { email: adminEmail, passwordHash: adminHash, name: "Admin", role: "ADMIN" },
  });

  // Create doctors
  const doctors = [
    { email: "dr.amine@careconnect.local", name: "Dr. Amine El K.", city: "Casablanca", lat: 33.5731, lng: -7.5898, priceMin: 250, langs: ["fr","ar"], specSlugs: ["gp"], address: "Maarif, Casablanca" },
    { email: "dr.sara@careconnect.local", name: "Dr. Sara B.", city: "Rabat", lat: 34.0209, lng: -6.8417, priceMin: 350, langs: ["fr","ar","en"], specSlugs: ["derm"], address: "Agdal, Rabat" },
    { email: "dr.youssef@careconnect.local", name: "Dr. Youssef N.", city: "Paris", lat: 48.8566, lng: 2.3522, priceMin: 60, langs: ["fr","en"], specSlugs: ["dentist"], address: "11e arrondissement, Paris" },
  ];

  for (const d of doctors) {
    const passwordHash = await bcrypt.hash("provider12345", 10);
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: { name: d.name, role: "PROVIDER", passwordHash },
      create: { email: d.email, name: d.name, role: "PROVIDER", passwordHash },
    });

    const provider = await prisma.provider.upsert({
      where: { userId: user.id },
      update: { type: "DOCTOR", status: "APPROVED" },
      create: { userId: user.id, type: "DOCTOR", status: "APPROVED" },
    });

    const doc = await prisma.doctorProfile.upsert({
      where: { providerId: provider.id },
      update: {
        clinicName: "CareConnect Clinic",
        bio: "MVP demo doctor profile. Replace with real verified details.",
        address: d.address,
        city: d.city,
        lat: d.lat,
        lng: d.lng,
        priceMin: d.priceMin,
        currencies: d.city === "Paris" ? "EUR" : "MAD",
        languages: d.langs,
        photos: [],
      },
      create: {
        providerId: provider.id,
        clinicName: "CareConnect Clinic",
        bio: "MVP demo doctor profile. Replace with real verified details.",
        address: d.address,
        city: d.city,
        lat: d.lat,
        lng: d.lng,
        priceMin: d.priceMin,
        currencies: d.city === "Paris" ? "EUR" : "MAD",
        languages: d.langs,
        photos: [],
      },
    });

    // specialties
    for (const slug of d.specSlugs) {
      const spec = await prisma.specialty.findUnique({ where: { slug } });
      if (spec) {
        await prisma.doctorSpecialty.upsert({
          where: { doctorId_specialtyId: { doctorId: doc.id, specialtyId: spec.id } },
          update: {},
          create: { doctorId: doc.id, specialtyId: spec.id },
        });
      }
    }

    // availability: Mon-Fri 09:00-17:00
    await prisma.availabilityRule.deleteMany({ where: { doctorId: doc.id } });
    for (const dayOfWeek of [1,2,3,4,5]) {
      await prisma.availabilityRule.create({
        data: { doctorId: doc.id, dayOfWeek, startTime: "09:00", endTime: "17:00", slotMinutes: 20 },
      });
    }
  }

  // Pharmacies
  const pharmacies = [
    { email: "pharma.casa@careconnect.local", name: "Pharmacie Central Casa", city: "Casablanca", lat: 33.5899, lng: -7.6039, address: "Centre-ville, Casablanca", phone: "+212600000000", services: ["delivery","dermocosmetics"], hours: "Mon-Sun 09:00-22:00" },
    { email: "pharma.rabat@careconnect.local", name: "Pharmacie Agdal", city: "Rabat", lat: 34.0119, lng: -6.8480, address: "Agdal, Rabat", phone: "+212611111111", services: ["night_service"], hours: "Mon-Sun 08:00-23:00" },
  ];

  for (const p of pharmacies) {
    const passwordHash = await bcrypt.hash("provider12345", 10);
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name, role: "PROVIDER", passwordHash },
      create: { email: p.email, name: p.name, role: "PROVIDER", passwordHash },
    });

    const provider = await prisma.provider.upsert({
      where: { userId: user.id },
      update: { type: "PHARMACY", status: "APPROVED" },
      create: { userId: user.id, type: "PHARMACY", status: "APPROVED" },
    });

    await prisma.pharmacyProfile.upsert({
      where: { providerId: provider.id },
      update: {
        name: p.name,
        address: p.address,
        city: p.city,
        lat: p.lat,
        lng: p.lng,
        phone: p.phone,
        hours: p.hours,
        services: p.services,
        photo: null,
      },
      create: {
        providerId: provider.id,
        name: p.name,
        address: p.address,
        city: p.city,
        lat: p.lat,
        lng: p.lng,
        phone: p.phone,
        hours: p.hours,
        services: p.services,
        photo: null,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:", adminEmail, "password:", adminPass);
  console.log("Provider login password for seeded providers:", "provider12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
