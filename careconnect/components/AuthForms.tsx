"use client";

import { useState } from "react";

async function postJSON(url: string, body: any) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export function AuthForms() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload: any = Object.fromEntries(fd.entries());
    try {
      if (mode === "register") {
        await postJSON("/api/auth/register", {
          email: payload.email,
          password: payload.password,
          name: payload.name,
          phone: payload.phone || undefined,
          city: payload.city || undefined,
          language: payload.language || undefined,
        });
      } else {
        await postJSON("/api/auth/login", { email: payload.email, password: payload.password });
      }
      window.location.href = "/account";
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{mode === "login" ? "Login" : "Create account"}</h2>
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
      </div>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        {mode === "register" ? (
          <>
            <div>
              <label className="text-sm">Name</label>
              <input name="name" required className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm">Phone (optional)</label>
                <input name="phone" className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">City (optional)</label>
                <input name="city" className="mt-1 w-full rounded border px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-sm">Language (optional, e.g. fr, ar, en)</label>
              <input name="language" className="mt-1 w-full rounded border px-3 py-2" />
            </div>
          </>
        ) : null}

        <div>
          <label className="text-sm">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input name="password" type="password" required className="mt-1 w-full rounded border px-3 py-2" />
          {mode === "register" ? <p className="mt-1 text-xs text-slate-500">Minimum 8 characters.</p> : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </div>
  );
}
