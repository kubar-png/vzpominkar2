/**
 * Cancels the parent (senior) layout's padding and fills the viewport below
 * the header - so the answer screen is a fixed, non-scrollable shell.
 * The 4.5rem offset equals the senior header height (py-5 + logo + gold rule).
 */
export default function NewMemoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="-mx-6 -mt-10 sm:-mt-16 -mb-10 sm:-mb-16 flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 4.5rem)" }}
    >
      {children}
    </div>
  );
}
