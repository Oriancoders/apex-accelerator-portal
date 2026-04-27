import { CreditPackage } from "./types";

export function validateDollarPerCredit(value: string): { valid: boolean; error?: string } {
  const val = parseFloat(value);
  if (isNaN(val) || val <= 0) {
    return { valid: false, error: "Invalid price" };
  }
  return { valid: true };
}

export function validateRates(rates: Record<string, string>): { valid: boolean; parsed?: Record<string, number>; error?: string } {
  const parsed: Record<string, number> = {};
  for (const [k, v] of Object.entries(rates)) {
    const n = parseInt(v);
    if (isNaN(n) || n < 0) {
      return { valid: false, error: `Invalid value for ${k}` };
    }
    parsed[k] = n;
  }
  return { valid: true, parsed };
}

export function validatePackages(packages: { buy: string; bonus: string }[]): { valid: boolean; parsed?: CreditPackage[]; error?: string } {
  const parsed: CreditPackage[] = [];
  for (const pkg of packages) {
    const buy = parseInt(pkg.buy);
    const bonus = parseInt(pkg.bonus);
    if (isNaN(buy) || buy <= 0) {
      return { valid: false, error: "Buy amount must be > 0" };
    }
    if (isNaN(bonus) || bonus < 0) {
      return { valid: false, error: "Bonus must be >= 0" };
    }
    parsed.push({ buy, bonus });
  }
  return { valid: true, parsed };
}

export function formatCurrency(value: number): string {
  return value.toFixed(2);
}
