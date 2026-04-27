import { LucideIcon } from "lucide-react";

export interface Principle {
  icon: LucideIcon;
  title: string;
  text: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export interface ContactSubmissionPayload {
  name: string;
  email: string;
  company: string | null;
  message: string;
}
