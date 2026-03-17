import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreditPackage {
  buy: number;
  bonus: number;
}

export interface CreditRates {
  dollarPerCredit: number;
  priorityRates: Record<string, number>;
  difficultyRates: Record<string, number>;
  packages: CreditPackage[];
  minWithdrawalCredits: number;
}

const DEFAULTS: CreditRates = {
  dollarPerCredit: 2.5,
  priorityRates: { low: 10, medium: 15, high: 20, critical: 30 },
  difficultyRates: { easy: 10, medium: 15, hard: 20, expert: 30 },
  packages: [
    { buy: 10, bonus: 2 },
    { buy: 25, bonus: 6 },
    { buy: 50, bonus: 15 },
    { buy: 100, bonus: 35 },
  ],
  minWithdrawalCredits: 10,
};

export function useCreditSettings() {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULTS, isLoading } = useQuery({
    queryKey: ["credit-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("credit_settings" as any)
        .select("key, value");
      if (!data || (data as any[]).length === 0) return DEFAULTS;

      const map: Record<string, any> = {};
      (data as any[]).forEach((row: any) => {
        map[row.key] = row.value;
      });

      return {
        dollarPerCredit: parseFloat(map.dollar_per_credit) || DEFAULTS.dollarPerCredit,
        priorityRates: map.priority_rates || DEFAULTS.priorityRates,
        difficultyRates: map.difficulty_rates || DEFAULTS.difficultyRates,
        packages: map.credit_packages || DEFAULTS.packages,
        minWithdrawalCredits: Number(map.min_withdrawal_credits) || DEFAULTS.minWithdrawalCredits,
      } as CreditRates;
    },
    staleTime: 60_000,
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await (supabase as any)
        .from("credit_settings")
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-settings"] });
    },
  });

  return { settings, isLoading, updateSetting };
}
