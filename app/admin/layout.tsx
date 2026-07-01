import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/session";
import { AdminNav } from "./_components/AdminNav";

/**
 * Admin chrome + defense-in-depth guard. Middleware already verifies the
 * `vzp_admin` session for every `/admin/*` request (except the login route);
 * this layout re-verifies in the server tree so a route is never rendered for
 * an unauthenticated request even if the matcher ever drifts. It never touches
 * Supabase auth.
 *
 * The login page lives under this layout, so we detect it via the
 * `x-admin-pathname` header set by middleware and render it bare (no nav, no
 * guard) to avoid a redirect loop.
 *
 * Layout: a dark monochrome left nav (AdminNav) + a light content canvas.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-admin-pathname") ?? "";
  const isLoginRoute = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isLoginRoute) {
    return <div className="min-h-screen bg-[#FEF7D7] text-[#1B2E4D] antialiased">{children}</div>;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const valid = await verifyAdminSession(token);
  if (!valid) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#FEF7D7] text-[#1B2E4D] antialiased">
      <AdminNav />
      <main className="md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
