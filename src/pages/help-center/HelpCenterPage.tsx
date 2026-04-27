import ProtectedLayout from "@/components/ProtectedLayout";
import { HeroSection } from "./components/HeroSection";
import { FeatureCardsSection } from "./components/FeatureCardsSection";
import { WorkflowAndDetailsSection } from "./components/WorkflowAndDetailsSection";
import { RoleCardsSection } from "./components/RoleCardsSection";
import { FAQSection } from "./components/FAQSection";

export default function HelpCenterPage() {
  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <HeroSection />
        <FeatureCardsSection />
        <WorkflowAndDetailsSection />
        <RoleCardsSection />
        <FAQSection />
      </div>
    </ProtectedLayout>
  );
}
