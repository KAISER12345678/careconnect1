import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

async function main() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || "CareConnect <no-reply@careconnect.local>";

  const transporter =
    smtpHost && smtpUser && smtpPass
      ? nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        })
      : null;

  const now = new Date();
  const window24hStart = hoursFromNow(23.5);
  const window24hEnd = hoursFromNow(24.5);
  const window2hStart = hoursFromNow(1.5);
  const window2hEnd = hoursFromNow(2.5);

  const candidates = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
      startAt: { gte: now, lte: hoursFromNow(48) },
    },
    include: {
      patient: { select: { email: true, name: true } },
      doctor: { include: { provider: { include: { user: { select: { name: true } } } } } },
    },
  });

  const toSend = [];
  for (const a of candidates) {
    const s = a.startAt.getTime();
    if (s >= window24hStart.getTime() && s <= window24hEnd.getTime()) toSend.push({ a, type: "24h" });
    if (s >= window2hStart.getTime() && s <= window2hEnd.getTime()) toSend.push({ a, type: "2h" });
  }

  console.log(`Found ${toSend.length} reminder(s) to send.`);

  for (const { a, type } of toSend) {
    const subject = `Reminder (${type}): Appointment with ${a.doctor.provider.user.name}`;
    const text = `Hi ${a.patient.name},\n\nThis is a reminder for your appointment (${type}) with ${a.doctor.provider.user.name} on ${a.startAt.toISOString()}.\n\nCareConnect`;
    if (!transporter) {
      console.log("[DRY RUN]", a.patient.email, subject);
      continue;
    }
    await transporter.sendMail({ from, to: a.patient.email, subject, text });
    console.log("Sent to", a.patient.email, subject);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
