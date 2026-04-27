import type { ContactFormData, ContactSubmissionPayload } from "./types";
import { emailSchema, safeMultilineTextSchema, safeTextSchema } from "@/lib/validation";

const contactSchema = {
  name: safeTextSchema(120, 1),
  email: emailSchema,
  company: safeTextSchema(160, 0),
  message: safeMultilineTextSchema(4000, 1),
};

export function validateContactForm(data: ContactFormData): { valid: boolean; error?: string } {
  if (!contactSchema.name.safeParse(data.name).success) {
    return { valid: false, error: "Please enter your name." };
  }

  if (!contactSchema.email.safeParse(data.email).success) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  if (!contactSchema.company.safeParse(data.company).success) {
    return { valid: false, error: "Company name must be 160 characters or less." };
  }

  if (!contactSchema.message.safeParse(data.message).success) {
    return { valid: false, error: "Please enter your message." };
  }

  return { valid: true };
}

export function prepareContactSubmission(
  data: ContactFormData
): ContactSubmissionPayload {
  return {
    name: contactSchema.name.parse(data.name),
    email: contactSchema.email.parse(data.email),
    company: contactSchema.company.parse(data.company) || null,
    message: contactSchema.message.parse(data.message),
  };
}
