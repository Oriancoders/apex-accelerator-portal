export interface CreditPackage {
  buy: number;
  bonus: number;
}

export interface CreditSettings {
  dollarPerCredit: number;
  priorityRates: Record<string, number>;
  difficultyRates: Record<string, number>;
  packages: CreditPackage[];
}

export type RateType = "priority" | "difficulty";
export type RateKey = string;
