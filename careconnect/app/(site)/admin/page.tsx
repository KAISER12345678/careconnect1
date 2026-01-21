import { verifySession } from "@/lib/auth";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  const me = verifySession();
  if (!me) return <div className="rounded-2xl border p-4">Please login first.</div>;
  if (me.role !== "ADMIN") return <div className="rounded-2xl border p-4">Forbidden.</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-slate-600">Approve providers and moderate reviews.</p>
      </div>
      <AdminDashboard />
    </div>
  );
}
