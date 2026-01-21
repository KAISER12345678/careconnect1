"use client";

import { useEffect, useState } from "react";

type Appt = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  priceAtBooking: number;
  doctorName: string;
  doctorId: string;
};

async function patchAppt(id: string, action: string) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

async function postReview(appointmentId: string, rating: number, text: string) {
  const res = await fetch(`/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ appointmentId, rating, text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Review failed");
  return data;
}

export function PatientAppointments() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/me/appointments", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-sm text-slate-600">Loading…</p>;
  if (err) return <p className="text-sm text-red-600">{err}</p>;

  return (
    <div className="space-y-3">
      {items.map((a) => {
        const start = new Date(a.startAt);
        const isFuture = start.getTime() > Date.now();
        return (
          <div key={a.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <a className="font-semibold no-underline" href={`/doctors/${a.doctorId}`}>{a.doctorName}</a>
                <div className="text-sm text-slate-600">{start.toLocaleString()}</div>
              </div>
              <div className="text-sm">
                <span className="rounded bg-slate-100 px-2 py-1">{a.status}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {isFuture && (a.status === "PENDING_CONFIRMATION" || a.status === "CONFIRMED") ? (
                <button
                  className="rounded border px-3 py-1 hover:bg-slate-50"
                  onClick={async () => {
                    await patchAppt(a.id, "CANCEL");
                    load();
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {a.status === "COMPLETED" ? <ReviewBox appointmentId={a.id} onDone={load} /> : null}
          </div>
        );
      })}
      {items.length === 0 ? <p className="text-sm text-slate-600">No appointments yet.</p> : null}
    </div>
  );
}

function ReviewBox({ appointmentId, onDone }: { appointmentId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="mt-4 rounded-xl border p-3">
      <div className="text-sm font-semibold">Leave a review</div>
      <div className="mt-2 grid gap-2 md:grid-cols-6">
        <select className="rounded border px-3 py-2 md:col-span-1" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} ★</option>)}
        </select>
        <input
          className="rounded border px-3 py-2 md:col-span-4"
          placeholder="Write a short review…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50 md:col-span-1"
          disabled={busy || text.trim().length < 3}
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            try {
              await postReview(appointmentId, rating, text.trim());
              setMsg("Thanks! Review submitted.");
              setText("");
              onDone();
            } catch (e: any) {
              setMsg(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-slate-600">{msg}</p> : null}
    </div>
  );
}
