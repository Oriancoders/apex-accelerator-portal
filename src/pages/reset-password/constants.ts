export const PASSWORD_RULES = {
  minLength: { label: "At least 10 characters", test: (pwd: string) => pwd.length >= 10 },
  uppercase: { label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
  lowercase: { label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
  number: { label: "One number", test: (pwd: string) => /\d/.test(pwd) },
  special: { label: "One special character", test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
};
