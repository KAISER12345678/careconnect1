"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = { startAt: string; endAt: string };

export function BookingWidget({ doctorId }: { doctorId: string }) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(todayStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [booking, setBooking] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load slots");
        if (!cancelled) setSlots(data.slots || []);
      } catch (e: any) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [doctorId, date]);

  async function book(startAt: string) {
    setBooking(startAt);
    setErr(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ doctorId, date, startAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Booking failed");
      window.location.href = "/account";
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBooking(null);
    }
  }

  return (
    <div className="rounded-2xl border p-4">
      <h3 className="text-lg font-semibold">Book an appointment</h3>
      <p className="mt-1 text-sm text-slate-600">Pick a date, then choose an available time slot.</p>

      <div className="mt-3">
        <label className="text-sm">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-600">Loading slots…</p> : null}
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        {slots.map((s) => (
          <button
            key={s.startAt}
            onClick={() => book(s.startAt)}
            disabled={!!booking}
            className="rounded border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {new Date(s.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </button>
        ))}
      </div>

      {!loading && slots.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No slots available for this date.</p>
      ) : null}

      <div className="mt-4 text-xs text-slate-500">
        By booking you agree this platform is for scheduling/admin only and does not provide medical advice.
      </div>
    </div>
  );
}
