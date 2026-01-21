import Link from "next/link";
import { getMe } from "@/lib/me";

export async function Navbar() {
  const me = await getMe();
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold text-slate-900 no-underline">
          CareConnect
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/search">Doctors</Link>
          <Link href="/pharmacies">Pharmacies</Link>
          {me ? (
            <>
              <Link href="/account">Account</Link>
              {me.role !== "PATIENT" ? <Link href="/provider">Provider</Link> : null}
              {me.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
              <form action="/api/auth/logout" method="post">
                <button className="rounded border px-3 py-1 hover:bg-slate-50" type="submit">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/account">Login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
