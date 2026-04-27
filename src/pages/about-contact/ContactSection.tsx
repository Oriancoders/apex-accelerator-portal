import { Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContactFormData } from "./types";

interface ContactSectionProps {
  formData: ContactFormData;
  onFormChange: (data: ContactFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
  supportEmail: string;
  supportPhone: string;
}

export function ContactSection({
  formData,
  onFormChange,
  onSubmit,
  isSending,
  supportEmail,
  supportPhone,
}: ContactSectionProps) {
  const updateField = <K extends keyof ContactFormData>(
    key: K,
    value: ContactFormData[K]
  ) => {
    onFormChange({ ...formData, [key]: value });
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-ds-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onSubmit}>
              <Input
                placeholder="Your name *"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                maxLength={120}
                autoComplete="name"
              />
              <Input
                type="email"
                placeholder="Your email *"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                maxLength={254}
                autoComplete="email"
              />
              <Input
                placeholder="Company (optional)"
                value={formData.company}
                onChange={(e) => updateField("company", e.target.value)}
                maxLength={160}
                autoComplete="organization"
              />
              <Textarea
                placeholder="Tell us what you need *"
                value={formData.message}
                onChange={(e) => updateField("message", e.target.value)}
                className="min-h-[120px]"
                maxLength={4000}
              />
              <Button type="submit" className="w-full" disabled={isSending}>
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-ds-xl">
          <CardHeader>
            <CardTitle className="text-base">Direct Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              {supportEmail}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              {supportPhone}
            </div>
            <p className="pt-2">
              Best for: onboarding, pricing questions, delivery timelines, and custom workflows.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
