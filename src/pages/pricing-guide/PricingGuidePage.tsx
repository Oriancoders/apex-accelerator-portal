import ProtectedLayout from "@/components/ProtectedLayout";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import { CreditExplanationCard } from "./components/CreditExplanationCard";
import { CalculationFormulaCard } from "./components/CalculationFormulaCard";
import { ExampleCalculationCard } from "./components/ExampleCalculationCard";
import { CreditPackagesCard } from "./components/CreditPackagesCard";
import { ProcessStepsCard } from "./components/ProcessStepsCard";

export default function PricingGuidePage() {
  const { settings, isLoading } = useCreditSettings();

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">How Pricing Works</h1>
          <p className="text-muted-foreground mt-1">
            Understand how credit costs are calculated for your service requests
          </p>
        </div>

        <CreditExplanationCard dollarPerCredit={settings.dollarPerCredit} />
        <CalculationFormulaCard
          priorityRates={settings.priorityRates}
          difficultyRates={settings.difficultyRates}
        />
        <ExampleCalculationCard
          priorityRates={settings.priorityRates}
          difficultyRates={settings.difficultyRates}
          dollarPerCredit={settings.dollarPerCredit}
        />
        <CreditPackagesCard packages={settings.packages} />
        <ProcessStepsCard />
      </div>
    </ProtectedLayout>
  );
}
