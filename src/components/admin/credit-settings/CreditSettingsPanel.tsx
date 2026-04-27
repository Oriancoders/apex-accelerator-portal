import { useState, useEffect } from "react";
import { useCreditSettings, CreditPackage } from "@/hooks/useCreditSettings";
import { toast } from "sonner";
import { PricePerCreditSection } from "./PricePerCreditSection";
import { CreditPackagesSection } from "./CreditPackagesSection";
import { PriorityRatesSection } from "./PriorityRatesSection";
import { DifficultyRatesSection } from "./DifficultyRatesSection";
import {
  validateDollarPerCredit,
  validateRates,
  validatePackages,
} from "./utils";
import { DEFAULT_PACKAGE } from "./constants";

export default function CreditSettingsPanel() {
  const { settings, isLoading, updateSetting } = useCreditSettings();

  const [dollarPerCredit, setDollarPerCredit] = useState("");
  const [priorityRates, setPriorityRates] = useState<Record<string, string>>({});
  const [difficultyRates, setDifficultyRates] = useState<Record<string, string>>({});
  const [packages, setPackages] = useState<{ buy: string; bonus: string }[]>([]);

  useEffect(() => {
    if (settings) {
      setDollarPerCredit(settings.dollarPerCredit.toString());
      setPriorityRates(
        Object.fromEntries(
          Object.entries(settings.priorityRates).map(([k, v]) => [k, v.toString()])
        )
      );
      setDifficultyRates(
        Object.fromEntries(
          Object.entries(settings.difficultyRates).map(([k, v]) => [k, v.toString()])
        )
      );
      setPackages(
        settings.packages.map((p) => ({
          buy: p.buy.toString(),
          bonus: p.bonus.toString(),
        }))
      );
    }
  }, [settings]);

  const saving = updateSetting.isPending;

  const handleSaveDollar = async () => {
    const validation = validateDollarPerCredit(dollarPerCredit);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    const val = parseFloat(dollarPerCredit);
    await updateSetting.mutateAsync({
      key: "dollar_per_credit",
      value: val.toString(),
    });
    toast.success("Dollar per credit updated!");
  };

  const handleSavePriority = async () => {
    const validation = validateRates(priorityRates);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    await updateSetting.mutateAsync({
      key: "priority_rates",
      value: validation.parsed!,
    });
    toast.success("Priority rates updated!");
  };

  const handleSaveDifficulty = async () => {
    const validation = validateRates(difficultyRates);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    await updateSetting.mutateAsync({
      key: "difficulty_rates",
      value: validation.parsed!,
    });
    toast.success("Difficulty rates updated!");
  };

  const handleSavePackages = async () => {
    const validation = validatePackages(packages);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    await updateSetting.mutateAsync({
      key: "credit_packages",
      value: validation.parsed!,
    });
    toast.success("Credit packages updated!");
  };

  const addPackage = () =>
    setPackages([...packages, { buy: DEFAULT_PACKAGE.buy, bonus: DEFAULT_PACKAGE.bonus }]);

  const removePackage = (i: number) =>
    setPackages(packages.filter((_, idx) => idx !== i));

  const updatePackage = (
    i: number,
    field: "buy" | "bonus",
    value: string
  ) => {
    const updated = [...packages];
    updated[i][field] = value;
    setPackages(updated);
  };

  if (isLoading)
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading settings...
      </div>
    );

  const dollarVal = parseFloat(dollarPerCredit) || 0;

  return (
    <div className="space-y-4">
      <PricePerCreditSection
        value={dollarPerCredit}
        onChange={setDollarPerCredit}
        onSave={handleSaveDollar}
        isSaving={saving}
      />

      <CreditPackagesSection
        packages={packages}
        dollarValue={dollarVal}
        onAddPackage={addPackage}
        onRemovePackage={removePackage}
        onUpdatePackage={updatePackage}
        onSave={handleSavePackages}
        isSaving={saving}
      />

      <PriorityRatesSection
        rates={priorityRates}
        onChange={setPriorityRates}
        onSave={handleSavePriority}
        isSaving={saving}
      />

      <DifficultyRatesSection
        rates={difficultyRates}
        onChange={setDifficultyRates}
        onSave={handleSaveDifficulty}
        isSaving={saving}
      />
    </div>
  );
}
