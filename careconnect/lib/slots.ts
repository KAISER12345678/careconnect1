import { AvailabilityException, AvailabilityRule, Appointment } from "@prisma/client";

function parseTimeHHMM(s: string): { h: number; m: number } {
  const [hh, mm] = s.split(":").map(Number);
  return { h: hh, m: mm };
}

/** Returns ISO strings (UTC) for available slot starts for a given date (YYYY-MM-DD) */
export function generateSlotsUTC(opts: {
  date: string; // YYYY-MM-DD in local user timezone (assume provider timezone = app timezone for MVP)
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  appointments: Appointment[];
  slotMinutesDefault?: number;
  tzOffsetMinutes?: number; // e.g. Morocco +60, France +60 (winter) - MVP constant, configurable
}): { startAt: Date; endAt: Date }[] {
  const { date, rules, exceptions, appointments } = opts;
  const tzOffset = opts.tzOffsetMinutes ?? 60;

  // Build a Date at local midnight then convert to UTC by subtracting tz offset.
  const [y, mo, d] = date.split("-").map(Number);
  const localMidnight = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0));
  const utcMidnight = new Date(localMidnight.getTime() - tzOffset * 60 * 1000);
  const dayOfWeek = new Date(localMidnight.getTime()).getUTCDay(); // local day-of-week approximation

  // Apply exception
  const ex = exceptions.find((e) => {
    const eDate = new Date(e.date);
    return (
      eDate.getUTCFullYear() === utcMidnight.getUTCFullYear() &&
      eDate.getUTCMonth() === utcMidnight.getUTCMonth() &&
      eDate.getUTCDate() === utcMidnight.getUTCDate()
    );
  });
  if (ex?.isClosed) return [];

  const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
  if (dayRules.length === 0) return [];

  // Combine rules by generating slots per rule
  const slots: { startAt: Date; endAt: Date }[] = [];
  for (const rule of dayRules) {
    const start = parseTimeHHMM(ex?.startTime ?? rule.startTime);
    const end = parseTimeHHMM(ex?.endTime ?? rule.endTime);
    const slotMinutes = rule.slotMinutes ?? opts.slotMinutesDefault ?? 20;

    // local start time -> UTC
    const startUtc = new Date(Date.UTC(y, mo - 1, d, start.h, start.m, 0));
    const endUtc = new Date(Date.UTC(y, mo - 1, d, end.h, end.m, 0));
    const startAt0 = new Date(startUtc.getTime() - tzOffset * 60 * 1000);
    const endAt0 = new Date(endUtc.getTime() - tzOffset * 60 * 1000);

    for (let t = startAt0.getTime(); t + slotMinutes * 60 * 1000 <= endAt0.getTime(); t += slotMinutes * 60 * 1000) {
      const s = new Date(t);
      const e = new Date(t + slotMinutes * 60 * 1000);
      slots.push({ startAt: s, endAt: e });
    }
  }

  // Remove conflicts with existing appointments (not CANCELLED)
  const busy = appointments.filter((a) => a.status !== "CANCELLED");
  const available = slots.filter((slot) => {
    return !busy.some((a) => overlaps(slot.startAt, slot.endAt, a.startAt, a.endAt));
  });

  // Sort
  available.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return available;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}
