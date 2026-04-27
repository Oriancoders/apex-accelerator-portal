import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HeroSection } from "./HeroSection";
import { PrinciplesSection } from "./PrinciplesSection";
import { ContactSection } from "./ContactSection";
import {
  PRINCIPLES,
  INITIAL_FORM_DATA,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from "./constants";
import {
  validateContactForm,
  prepareContactSubmission,
} from "./utils";
import type { ContactFormData } from "./types";

export default function AboutContactPage() {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_DATA);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateContactForm(formData);
    if (!validation.valid) {
      toast.error(validation.error || "Please check your form.");
      return;
    }

    const payload = prepareContactSubmission(formData);

    setSending(true);
    try {
      const { error } = await supabase
        .from("contact_submissions" as any)
        .insert(payload);
      if (error) throw error;

      toast.success(
        "Thanks for contacting Customer Connect. We will reply soon."
      );
      setFormData(INITIAL_FORM_DATA);
    } catch {
      toast.error(
        "Unable to send your message right now. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PrinciplesSection principles={PRINCIPLES} />
      <ContactSection
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        isSending={sending}
        supportEmail={SUPPORT_EMAIL}
        supportPhone={SUPPORT_PHONE}
      />
      <Footer />
    </div>
  );
}
