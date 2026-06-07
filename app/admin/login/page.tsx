import type { Metadata } from "next";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin · přihlášení",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-zinc-900">Admin</h1>
            <p className="mt-1 text-sm text-zinc-500">Interní přehled. Přihlaste se.</p>
          </div>
          <AdminLoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400">Vzpomínkář · interní nástroj</p>
      </div>
    </div>
  );
}
