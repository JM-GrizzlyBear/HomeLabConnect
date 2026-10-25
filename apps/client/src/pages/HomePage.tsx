import { CallToActionSection } from "@/components/home/CallToActionSection";
import { DiscountBanner } from "@/components/home/DiscountBanner";
import { FaqSection } from "@/components/home/FaqSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PopularTestsSection } from "@/components/home/PopularTestsSection";
import { WhyUsSection } from "@/components/home/WhyUsSection";

/** The public homepage: what the service is, how it works, prices and answers, then sign up. */
export function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <HomeHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <PopularTestsSection />
        <DiscountBanner />
        <WhyUsSection />
        <FaqSection />
        <CallToActionSection />
      </main>
      <HomeFooter />
    </div>
  );
}
