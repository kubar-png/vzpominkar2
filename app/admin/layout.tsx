import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/session";
import { logoutAdmin } from "@/lib/admin/actions";

/**
 * Admin chrome + defense-in-depth guard. Middleware already verifies the
 * `vzp_admin` session for every `/admin/*` request (except the login route);
 * this layout re-verifies in the server tree so a route is never rendered for
 * an unauthenticated request even if the matcher ever drifts. It never touches
 * Supabase auth.
 *
 * The login page lives under this layout, so we detect it via the
 * `x-admin-pathname` header set by middleware and render it bare (no guard, no
 * chrome) to avoid a redirect loop.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-admin-pathname") ?? "";
  const isLoginRoute = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isLoginRoute) {
    return <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">{children}</div>;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const valid = await verifyAdminSession(token);
  if (!valid) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">Vzpomínkář</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Admin
            </span>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
            >
              Odhlásit se
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
