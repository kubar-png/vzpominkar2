/**
 * Senior /home layout — pulls the page up against the header so the
 * question card sits naturally without an awkward dead band. Width and
 * editorial scope are inherited from /app/(senior)/layout.tsx.
 */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <div className="-mt-10 sm:-mt-14">{children}</div>;
}
