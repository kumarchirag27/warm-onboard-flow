import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import UseCases from "@/components/landing/UseCases";
import Compliance from "@/components/landing/Compliance";
import Pricing from "@/components/landing/Pricing";
import CompareSection from "@/components/landing/CompareSection";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <UseCases />
      <Compliance />
      <Pricing />
      <CompareSection />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
