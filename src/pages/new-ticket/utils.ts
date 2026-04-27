import { emailSchema, phoneSchema, safeMultilineTextSchema, safeTextSchema } from "@/lib/validation";

export function validateTitle(title: string): { valid: boolean; error?: string } {
  const parsed = safeTextSchema(200, 1).safeParse(title);
  if (!parsed.success) return { valid: false, error: "Title is required and must be 200 characters or less" };
  return { valid: true };
}

export function validateDescription(desc: string): { valid: boolean; error?: string } {
  const parsed = safeMultilineTextSchema(10000, 1).safeParse(desc);
  if (!parsed.success) return { valid: false, error: "Description is required and must be 10,000 characters or less" };
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: true };
  if (!emailSchema.safeParse(email).success) {
    return { valid: false, error: "Please enter a valid contact email" };
  }
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) return { valid: true };
  if (!phoneSchema.safeParse(phone).success) {
    return { valid: false, error: "Please enter a valid phone number" };
  }
  return { valid: true };
}

export function normalizeTicketTitle(title: string) {
  return safeTextSchema(200, 1).parse(title);
}

export function normalizeTicketDescription(description: string) {
  return safeMultilineTextSchema(10000, 1).parse(description);
}
