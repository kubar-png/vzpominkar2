import type { Metadata } from "next";
import { canonical } from "@/lib/site";

import { AnnouncementBar } from "./_components/AnnouncementBar";
import { Nav } from "./_components/Nav";
import { Hero } from "./_components/Hero";
import { Press } from "./_components/Press";
import { HowItWorks } from "./_components/HowItWorks";
import { Pricing } from "./_components/Pricing";
import { ProductDetail } from "./_components/ProductDetail";
import { Testimonials } from "./_components/Testimonials";
import { UseCases } from "./_components/UseCases";
import { Faq } from "./_components/Faq";
import { Newsletter } from "./_components/Newsletter";
import { Footer } from "./_components/Footer";
import { StickyBar } from "./_components/StickyBar";

export const metadata: Metadata = {
  title: "Chci znát tvůj příběh — kniha plná otázek jako dárek",
  description:
    "Vázaná kniha s 300 otázkami, kterou darujete blízkému. Vyplní ji vlastními slovy — a vznikne rodinný příběh, který zůstane. Možnost přidat vlastní otázky.",
  alternates: { canonical: canonical("/pribeh") },
};

export default function PribehPage() {
  return (
    <>
      <AnnouncementBar />
      <Nav />
      <main>
        <Hero />
        <Press />
        <HowItWorks />
        <Pricing />
        <ProductDetail />
        <Testimonials />
        <UseCases />
        <Faq />
        <Newsletter />
      </main>
      <Footer />
      <StickyBar />
    </>
  );
}
