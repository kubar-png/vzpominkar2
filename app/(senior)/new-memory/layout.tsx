/**
 * New-memory layout — passes children through. The parent senior shell
 * already provides the cream canvas, header, and centered container.
 * Each new-memory page owns its own layout above the form.
 */
export default function NewMemoryLayout({ children }: { children: React.ReactNode }) {
  return <div className="-mt-10 sm:-mt-14">{children}</div>;
}
