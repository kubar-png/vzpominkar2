import { currentUser } from "@/lib/auth/permissions";
import { VerifyEmailBanner } from "./VerifyEmailBanner";

/**
 * Server wrapper: renders the verify-email banner only for signed-in owners
 * who haven't verified yet. Renders nothing otherwise. `currentUser()` is
 * request-cached, so calling it here on top of the layout's own auth is free.
 */
export async function VerifyEmailNotice({ className = "mb-6" }: { className?: string }) {
  const user = await currentUser();
  if (!user || user.role !== "owner" || user.emailVerified) return null;
  return (
    <div className={className}>
      <VerifyEmailBanner email={user.email} />
    </div>
  );
}
