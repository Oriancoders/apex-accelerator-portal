import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  ChevronDown,
  Send,
  MessageSquare,
  Clock,
  Award,
  Target,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

const teamMembers = [
  { name: "Alex Morgan", role: "Lead Salesforce Architect", exp: "12+ years" },
  { name: "Sarah Chen", role: "Senior SF Developer", exp: "10+ years" },
  { name: "James Wilson", role: "SF Admin & Consultant", exp: "8+ years" },
  { name: "Priya Patel", role: "Integration Specialist", exp: "9+ years" },
];

const testimonials = [
  {
    name: "Michael Torres",
    company: "Apex Solutions Inc.",
    text: "Switched from a $12K/month retainer to pay-as-you-go. Saved over 65% in the first quarter alone. The quality of work is outstanding.",
    rating: 5,
  },
  {
    name: "Rebecca Liu",
    company: "CloudFirst Partners",
    text: "Their team resolved a complex CPQ integration in 48 hours that our previous consultant quoted 3 weeks for. Incredible turnaround.",
    rating: 5,
  },
  {
    name: "David Okonkwo",
    company: "NovaTech Global",
    text: "The credit-based system is genius. We only pay when we actually need help. No more paying consultants to sit idle during slow months.",
    rating: 5,
  },
  {
    name: "Emma Janssen",
    company: "Meridian Health",
    text: "Transparent pricing, real-time ticket tracking, and a team that actually understands Salesforce Health Cloud. Couldn't ask for more.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "How does the pay-as-you-go model work?",
    a: "You purchase credits at your convenience. When you submit a ticket, credits are deducted based on the task's priority and difficulty. No monthly retainers, no contracts — you only pay for the work that gets done.",
  },
  {
    q: "What Salesforce services do you offer?",
    a: "We cover Administration, Development (Apex, LWC, Visualforce), Integrations, CPQ, Health Cloud, Financial Services Cloud, Data Migration, Reporting & Dashboards, and more.",
  },
  {
    q: "How quickly will my ticket be resolved?",
    a: "Most standard tickets are resolved within 24–48 hours. Critical and high-priority tickets receive immediate attention and faster turnaround.",
  },
  {
    q: "Can I book a meeting to discuss my project?",
    a: "Absolutely! Use the contact form on this page or reach out via email/phone. We'll schedule a free consultation to understand your needs.",
  },
  {
    q: "Do you offer ongoing support or just one-off tasks?",
    a: "Both! You can use us for one-off fixes or ongoing support. Many clients keep a credit balance and submit tickets as needs arise — it's entirely flexible.",
  },
  {
    q: "What if I'm not satisfied with the work?",
    a: "We have a 98% satisfaction rate, but if you're ever unhappy, we'll revise the work at no extra cost. Your satisfaction is guaranteed.",
  },
  {
    q: "Is my Salesforce data secure?",
    a: "Yes. We follow SOC-2 compliant practices, use encrypted communications, and never store your Salesforce credentials. All access is granted via secure, time-limited sessions.",
  },
];

export default function AboutContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", company: "", message: "" });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              About & Contact
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              Your Trusted <span className="text-primary">Salesforce Partner</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We're a team of certified Salesforce experts passionate about delivering
              exceptional results — without the overhead of traditional consulting.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission / About */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {[
              { icon: Target, title: "Our Mission", desc: "To make expert Salesforce support accessible and affordable for businesses of every size through our innovative pay-as-you-go model." },
              { icon: Heart, title: "Our Values", desc: "Transparency, quality, and client success drive everything we do. No hidden fees, no long contracts — just results." },
              { icon: Award, title: "Our Promise", desc: "98% client satisfaction rate. If you're not happy with the work, we'll revise it at no additional cost." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Meet Our Team</h2>
            <p className="text-muted-foreground mt-2">Certified professionals with decades of combined Salesforce experience.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {teamMembers.map((m, i) => (
              <motion.div
                key={m.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-5 text-center hover:shadow-md transition-shadow"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold text-foreground">{m.name}</h4>
                <p className="text-sm text-primary font-medium">{m.role}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.exp} experience</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What Our Clients Say</h2>
            <p className="text-muted-foreground mt-2">Real feedback from businesses that switched to our model.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed italic mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.company}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + Book Meeting */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Get in Touch</h2>
            <p className="text-muted-foreground mt-2">Have questions? Want to book a free consultation? We'd love to hear from you.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <h3 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Send Us a Message
              </h3>
              <p className="text-sm text-muted-foreground mb-5">We'll respond within 24 hours.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your Email *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    maxLength={255}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Company (optional)"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    maxLength={100}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Your Message *"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    maxLength={1000}
                    className="min-h-[120px] rounded-xl resize-none"
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={sending}>
                  {sending ? "Sending..." : (
                    <>
                      Send Message <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Contact Info + Book Meeting */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              {/* Book Meeting Card */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
                <h3 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Book a Free Consultation
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Schedule a 30-minute call with our Salesforce experts to discuss your needs — completely free.
                </p>
                <div className="space-y-3 mb-5">
                  {["Discuss your Salesforce challenges", "Get a custom solution roadmap", "Understand our credit-based pricing", "No obligation, no pressure"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="h-3 w-3 text-primary" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
                <Button
                  size="lg"
                  className="w-full h-12 rounded-xl font-bold"
                  onClick={() => setShowCalendly(true)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule a Meeting
                </Button>
              </div>

              {/* Contact Details */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold text-foreground text-base mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {[
                    { icon: Mail, label: "support@sfservices.com" },
                    { icon: Phone, label: "+1 (555) 123-4567" },
                    { icon: MapPin, label: "San Francisco, CA" },
                    { icon: Clock, label: "Mon–Fri, 9 AM – 6 PM PST" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <c.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-foreground">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-2">Everything you need to know about our services.</p>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`faq-${i}`}
                  className="rounded-xl border border-border bg-card px-5 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Calendly Modal */}
      {showCalendly && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4" onClick={() => setShowCalendly(false)}>
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="bg-card rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl h-[90vh] sm:h-[80vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Schedule a Meeting
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCalendly(false)} className="h-8 w-8 p-0 rounded-full">
                ✕
              </Button>
            </div>
            <iframe
              src="https://calendly.com/shiftdeploy/30min"
              className="w-full h-[calc(90vh-52px)] sm:h-[calc(80vh-52px)] border-0"
              title="Schedule a Meeting"
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
