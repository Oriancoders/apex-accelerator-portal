import { PASSWORD_RULES } from "./constants";

export function getPasswordRules(password: string) {
  return {
    minLength: PASSWORD_RULES.minLength.test(password),
    uppercase: PASSWORD_RULES.uppercase.test(password),
    lowercase: PASSWORD_RULES.lowercase.test(password),
    number: PASSWORD_RULES.number.test(password),
    special: PASSWORD_RULES.special.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const rules = getPasswordRules(password);
  return Object.values(rules).every(Boolean);
}
