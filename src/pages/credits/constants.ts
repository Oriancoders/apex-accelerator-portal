export const PAGE_SIZE = 10;

export const WITHDRAWAL_METHODS = {
  BANK_TRANSFER: "bank_transfer",
  PAYPAL: "paypal",
  UPI: "upi",
  OTHER: "other",
} as const;

export const PAYMENT_METHODS_LABELS = {
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
  upi: "UPI",
  other: "Other",
} as const;
