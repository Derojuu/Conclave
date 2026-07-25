import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ApplicationsSection } from "@/components/sections/applications-section";
import { ArchitectureSection } from "@/components/sections/architecture-section";
import { ConfidentialitySection } from "@/components/sections/confidentiality-section";
import { FaqSection } from "@/components/sections/faq-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { HeroSection } from "@/components/sections/hero-section";
import { InteractiveDemoSection } from "@/components/sections/interactive-demo-section";
import { NoxSection } from "@/components/sections/nox-section";
import { ProblemSection } from "@/components/sections/problem-section";
import { ProcessSection } from "@/components/sections/process-section";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6">
        <HeroSection />
        <ProblemSection />
        <ConfidentialitySection />
        <ProcessSection />
        <NoxSection />
        <ApplicationsSection />
        <FeaturesSection />
        <InteractiveDemoSection />
        <ArchitectureSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
