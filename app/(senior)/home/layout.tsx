export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="-mx-6 -mt-10 sm:-mt-16 -mb-10 sm:-mb-16 flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 4.5rem)" }}
    >
      {children}
    </div>
  );
}
