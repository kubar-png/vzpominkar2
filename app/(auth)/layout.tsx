import { Shell } from "@/components/landing/Shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell
      showPromo={false}
      headerVariant="minimal"
      footerVariant="minimal"
      motion={false}
      stickyMobileCta={false}
    >
      {children}
    </Shell>
  );
}
