"use client";

import { useEffect, useState } from "react";

type Rule = { id: string; dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number };
type Appt = { id: string; startAt: string; endAt: string; status: string; patient: { name: string; phone?: string | null } };

const dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function ProviderDashboard() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const [r1, r2] = await Promise.all([
      fetch("/api/provider/availability", { cache: "no-store" }),
      fetch("/api/provider/appointments", { cache: "no-store" }),
    ]);
    const d1 = await r1.json();
    const d2 = await r2.json();
    if (!r1.ok) throw new Error(d1?.error || "Failed to load availability");
    if (!r2.ok) throw new Error(d2?.error || "Failed to load appointments");
    setRules(d1.rules || []);
    setAppts(d2.items || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function addRule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      dayOfWeek: Number(fd.get("dayOfWeek")),
      startTime: String(fd.get("startTime")),
      endTime: String(fd.get("endTime")),
      slotMinutes: Number(fd.get("slotMinutes")),
    };
    const res = await fetch("/api/provider/availability", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to add rule");
    await load();
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">Availability (weekly)</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-5" onSubmit={addRule}>
          <select name="dayOfWeek" className="rounded border px-3 py-2">
            {dow.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <input name="startTime" defaultValue="09:00" className="rounded border px-3 py-2" />
          <input name="endTime" defaultValue="17:00" className="rounded border px-3 py-2" />
          <input name="slotMinutes" type="number" defaultValue={20} min={10} max={120} className="rounded border px-3 py-2" />
          <button className="rounded bg-slate-900 px-4 py-2 text-white">Add</button>
        </form>

        <div className="mt-4 grid gap-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
              <div>{dow[r.dayOfWeek]} {r.startTime}–{r.endTime} ({r.slotMinutes}m)</div>
              <div className="text-slate-500">Rule</div>
            </div>
          ))}
          {rules.length === 0 ? <p className="text-sm text-slate-600">No availability rules yet.</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">Appointments</h2>
        <div className="mt-3 grid gap-2">
          {appts.map((a) => (
            <div key={a.id} className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{new Date(a.startAt).toLocaleString()}</div>
                <div className="rounded bg-slate-100 px-2 py-1">{a.status}</div>
              </div>
              <div className="mt-1 text-slate-600">Patient: {a.patient.name}{a.patient.phone ? ` • ${a.patient.phone}` : ""}</div>
              <div className="mt-2 flex gap-2">
                <ActionButton apptId={a.id} action="CONFIRM" label="Confirm" onDone={load} />
                <ActionButton apptId={a.id} action="COMPLETE" label="Complete" onDone={load} />
                <ActionButton apptId={a.id} action="NO_SHOW" label="No-show" onDone={load} />
                <ActionButton apptId={a.id} action="CANCEL" label="Cancel" onDone={load} />
              </div>
            </div>
          ))}
          {appts.length === 0 ? <p className="text-sm text-slate-600">No appointments yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ apptId, action, label, onDone }: { apptId: string; action: string; label: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="rounded border px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/appointments/${apptId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || "Action failed");
          onDone();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}
