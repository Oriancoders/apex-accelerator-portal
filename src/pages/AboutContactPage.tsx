import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Phone, Rocket, ShieldCheck, Timer } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const principles = [
  {
    icon: Timer,
    title: "Pay As You Go",
    text: "No retainers and no monthly commitment. You only pay when work is approved and delivered.",
  },
  {
    icon: Rocket,
    title: "Fast Execution",
    text: "Create a ticket, review the proposal, approve it, and track progress in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Clear Process",
    text: "Transparent ticket stages, clear ownership, and communication history across the task lifecycle.",
  },
];

export default function AboutContactPage() {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      company: formData.company.trim() || null,
      message: formData.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      toast.error("Please complete all required fields.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("contact_submissions" as any).insert(payload);
      if (error) throw error;

      toast.success("Thanks for contacting CustomerPortol. We will reply soon.");
      setFormData({ name: "", email: "", company: "", message: "" });
    } catch {
      toast.error("Unable to send your message right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight"
          >
            Get to Know CustomerPortol
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground"
          >
            We onboard your team, convert your request into a clear ticket, and deliver work through a
            structured pay-as-you-go system designed for speed and control.
          </motion.p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {principles.map((item) => (
            <Card key={item.title} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input
                  placeholder="Your name *"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="email"
                  placeholder="Your email *"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder="Company (optional)"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                />
                <Textarea
                  placeholder="Tell us what you need *"
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  className="min-h-[120px]"
                />
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Direct Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                support@customerportol.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                +1 (555) 123-4567
              </div>
              <p className="pt-2">
                Best for: onboarding, pricing questions, delivery timelines, and custom workflows.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
