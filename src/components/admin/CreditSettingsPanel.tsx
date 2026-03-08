import { useState, useEffect } from "react";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, DollarSign, Layers, Gauge, Save } from "lucide-react";

export default function CreditSettingsPanel() {
  const { settings, isLoading, updateSetting } = useCreditSettings();

  const [dollarPerCredit, setDollarPerCredit] = useState("");
  const [priorityRates, setPriorityRates] = useState<Record<string, string>>({});
  const [difficultyRates, setDifficultyRates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setDollarPerCredit(settings.dollarPerCredit.toString());
      setPriorityRates(
        Object.fromEntries(Object.entries(settings.priorityRates).map(([k, v]) => [k, v.toString()]))
      );
      setDifficultyRates(
        Object.fromEntries(Object.entries(settings.difficultyRates).map(([k, v]) => [k, v.toString()]))
      );
    }
  }, [settings]);

  const saving = updateSetting.isPending;

  const handleSaveDollar = async () => {
    const val = parseFloat(dollarPerCredit);
    if (isNaN(val) || val <= 0) { toast.error("Invalid price"); return; }
    await updateSetting.mutateAsync({ key: "dollar_per_credit", value: val.toString() });
    toast.success("Dollar per credit updated!");
  };

  const handleSavePriority = async () => {
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(priorityRates)) {
      const n = parseInt(v);
      if (isNaN(n) || n < 0) { toast.error(`Invalid value for ${k}`); return; }
      parsed[k] = n;
    }
    await updateSetting.mutateAsync({ key: "priority_rates", value: parsed });
    toast.success("Priority rates updated!");
  };

  const handleSaveDifficulty = async () => {
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(difficultyRates)) {
      const n = parseInt(v);
      if (isNaN(n) || n < 0) { toast.error(`Invalid value for ${k}`); return; }
      parsed[k] = n;
    }
    await updateSetting.mutateAsync({ key: "difficulty_rates", value: parsed });
    toast.success("Difficulty rates updated!");
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading settings...</div>;

  const priorityLabels: Record<string, string> = { low: "🟢 Low", medium: "🟡 Medium", high: "🟠 High", critical: "🔴 Critical" };
  const difficultyLabels: Record<string, string> = { easy: "🟢 Easy", medium: "🟡 Medium", hard: "🟠 Hard", expert: "🔴 Expert" };

  return (
    <div className="space-y-4">
      {/* Dollar per credit */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Price Per Credit
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dollar amount ($) per 1 credit</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={dollarPerCredit}
                  onChange={(e) => setDollarPerCredit(e.target.value)}
                  className="pl-7 h-10 rounded-xl"
                />
              </div>
            </div>
            <Button onClick={handleSaveDollar} disabled={saving} size="sm" className="rounded-xl gap-1.5 h-10">
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Priority rates */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Gauge className="h-4 w-4 text-accent" />
            Priority Credit Rates
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Credits added per hour based on ticket priority</p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(priorityLabels).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={priorityRates[key] || "0"}
                    onChange={(e) => setPriorityRates({ ...priorityRates, [key]: e.target.value })}
                    className="h-9 rounded-lg text-sm pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">cr/hr</span>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSavePriority} disabled={saving} size="sm" className="mt-3 rounded-xl gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Priority Rates
          </Button>
        </CardContent>
      </Card>

      {/* Difficulty rates */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Difficulty Level Rates
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Credits added per hour based on task difficulty (set by admin)</p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(difficultyLabels).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={difficultyRates[key] || "0"}
                    onChange={(e) => setDifficultyRates({ ...difficultyRates, [key]: e.target.value })}
                    className="h-9 rounded-lg text-sm pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">cr/hr</span>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSaveDifficulty} disabled={saving} size="sm" className="mt-3 rounded-xl gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Difficulty Rates
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
