import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import StoriesSection from "@/components/landing/StoriesSection";
import MissionSection from "@/components/landing/MissionSection";
import ChildrenSection from "@/components/landing/ChildrenSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="font-[family-name:var(--font-nunito)]">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <StoriesSection />
      <MissionSection />
      <ChildrenSection />
      <HowItWorksSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
