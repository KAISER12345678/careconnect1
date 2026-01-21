import { verifySession } from "@/lib/auth";
import { ProviderDashboard } from "@/components/ProviderDashboard";

export default function ProviderPage() {
  const me = verifySession();
  if (!me) return <div className="rounded-2xl border p-4">Please login first.</div>;
  if (me.role !== "PROVIDER" && me.role !== "ADMIN") return <div className="rounded-2xl border p-4">Forbidden.</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <h1 className="text-2xl font-semibold">Provider dashboard</h1>
        <p className="mt-1 text-slate-600">Manage availability and appointments.</p>
      </div>
      <ProviderDashboard />
    </div>
  );
}
