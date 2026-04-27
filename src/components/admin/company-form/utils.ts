import { CompanyFormData } from "./types";
import { emailSchema, phoneSchema, safeTextSchema, urlSchema } from "@/lib/validation";

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateForm(formData: CompanyFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) {
    errors.name = "Business name is required";
  } else if (!safeTextSchema(160, 1).safeParse(formData.name).success) {
    errors.name = "Business name must be 160 characters or less";
  }
  if (!formData.slug.trim()) {
    errors.slug = "Slug is required";
  }
  if (formData.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
    errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
  }
  if (!urlSchema.safeParse(formData.website).success) {
    errors.website = "Website must be a valid http:// or https:// URL";
  }
  if (formData.contactEmail && !emailSchema.safeParse(formData.contactEmail).success) {
    errors.contactEmail = "Contact email must be valid";
  }
  if (formData.contactPhone && !phoneSchema.safeParse(formData.contactPhone).success) {
    errors.contactPhone = "Contact phone must be valid";
  }

  return errors;
}

export const INITIAL_FORM_DATA: CompanyFormData = {
  name: "",
  slug: "",
  businessType: "",
  annualTurnover: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};
