"use client";

import { useEffect, useState } from "react";

export function AdminDashboard() {
  const [providers, setProviders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const [pRes, rRes] = await Promise.all([
      fetch("/api/admin/providers", { cache: "no-store" }),
      fetch("/api/admin/reviews", { cache: "no-store" }),
    ]);
    const pData = await pRes.json();
    const rData = await rRes.json();
    if (!pRes.ok) throw new Error(pData?.error || "Failed to load providers");
    if (!rRes.ok) throw new Error(rData?.error || "Failed to load reviews");
    setProviders(pData.items || []);
    setReviews(rData.items || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function setProviderStatus(providerId: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/admin/providers", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to update provider");
    await load();
  }

  async function setReviewHidden(reviewId: string, isHidden: boolean) {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId, isHidden }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to update review");
    await load();
  }

  return (
    <div className="space-y-6">
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">Providers</h2>
        <p className="mt-1 text-sm text-slate-600">Approve or reject provider listings.</p>

        <div className="mt-3 grid gap-2">
          {providers.map((p) => (
            <div key={p.id} className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{p.user.name} • {p.type}</div>
                <div className="rounded bg-slate-100 px-2 py-1">{p.status}</div>
              </div>
              <div className="mt-1 text-slate-600">{p.user.email}{p.user.phone ? ` • ${p.user.phone}` : ""}</div>
              <div className="mt-2 flex gap-2">
                <button className="rounded border px-3 py-1 hover:bg-slate-50" onClick={() => setProviderStatus(p.id, "APPROVED")}>Approve</button>
                <button className="rounded border px-3 py-1 hover:bg-slate-50" onClick={() => setProviderStatus(p.id, "REJECTED")}>Reject</button>
              </div>
            </div>
          ))}
          {providers.length === 0 ? <p className="text-sm text-slate-600">No providers.</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="text-lg font-semibold">Reviews moderation</h2>
        <div className="mt-3 grid gap-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{r.doctor.provider.user.name}</div>
                <div className="rounded bg-slate-100 px-2 py-1">{r.isHidden ? "HIDDEN" : "VISIBLE"}</div>
              </div>
              <div className="mt-1 text-slate-600">{r.patient.name} • {r.rating} ★</div>
              <p className="mt-2">{r.text}</p>
              <div className="mt-2 flex gap-2">
                <button className="rounded border px-3 py-1 hover:bg-slate-50" onClick={() => setReviewHidden(r.id, false)}>Unhide</button>
                <button className="rounded border px-3 py-1 hover:bg-slate-50" onClick={() => setReviewHidden(r.id, true)}>Hide</button>
              </div>
            </div>
          ))}
          {reviews.length === 0 ? <p className="text-sm text-slate-600">No reviews.</p> : null}
        </div>
      </div>
    </div>
  );
}
