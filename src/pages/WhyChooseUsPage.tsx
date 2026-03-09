import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Zap,
  Shield,
  Clock,
  BarChart3,
  HeadphonesIcon,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const comparisonData = [
  { label: "Monthly cost (idle periods)", traditional: "$8,000 – $15,000+", ours: "$0" },
  { label: "Pay only when you need", traditional: "No", ours: "Yes" },
  { label: "Expert-level staff", traditional: "Varies", ours: "Always" },
  { label: "Transparent pricing", traditional: "Rarely", ours: "Always" },
  { label: "No long-term contracts", traditional: "6–12 month lock-in", ours: "None" },
  { label: "Real-time ticket tracking", traditional: "Email threads", ours: "Built-in" },
];

const features = [
  {
    icon: DollarSign,
    title: "Pay-As-You-Go",
    desc: "Only pay for the work you need — no retainers, no idle billing. Buy credits and spend them on actual tasks.",
  },
  {
    icon: TrendingDown,
    title: "Cut Costs by 60%+",
    desc: "Traditional Salesforce consultants charge even when idle. Our credit-based model eliminates waste entirely.",
  },
  {
    icon: Users,
    title: "Experienced Team",
    desc: "Certified Salesforce Admins, Developers & Architects with 10+ years of hands-on platform experience.",
  },
  {
    icon: Zap,
    title: "Fast Turnaround",
    desc: "Most tickets resolved within 24–48 hours. Priority & critical issues get immediate attention.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "SOC-2 compliant practices, encrypted communications, and strict data handling policies.",
  },
  {
    icon: BarChart3,
    title: "Full Transparency",
    desc: "Track every ticket, credit spend, and progress update in real-time through your personal dashboard.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    desc: "AI-powered chatbot for instant help plus human experts when you need deeper assistance.",
  },
  {
    icon: Lightbulb,
    title: "Knowledge Base & Recipes",
    desc: "Access curated Salesforce guides, recipes, and best practices — all included with your account.",
  },
];

const stats = [
  { value: "500+", label: "Tickets Resolved" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "10+", label: "Years Experience" },
  { value: "60%", label: "Average Cost Savings" },
];

export default function WhyChooseUsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              Why Choose Us
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              Stop Paying for{" "}
              <span className="text-primary">Idle Consultants</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Hiring a full-time Salesforce admin or developer costs{" "}
              <strong className="text-foreground">$8,000–$15,000+/month</strong> — even when
              they have nothing to do. With our pay-as-you-go credit system, you only pay for
              actual work delivered.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="h-12 px-8 rounded-xl font-bold text-base"
                onClick={() => navigate("/tickets/new")}
              >
                Submit a Ticket <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl font-bold text-base"
                onClick={() => navigate("/pricing")}
              >
                View Pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Traditional Consulting vs. SF Services
          </h2>
          <p className="text-muted-foreground mt-2">See how our model saves you money and headaches.</p>
        </motion.div>

        <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
          <div className="grid grid-cols-3 bg-muted/50 px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Feature</span>
            <span className="text-center">Traditional</span>
            <span className="text-center text-primary">SF Services</span>
          </div>
          {comparisonData.map((row, i) => (
            <motion.div
              key={row.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`grid grid-cols-3 px-4 sm:px-6 py-4 text-sm items-center ${
                i % 2 === 0 ? "bg-card" : "bg-muted/20"
              }`}
            >
              <span className="font-medium text-foreground">{row.label}</span>
              <span className="text-center text-muted-foreground">{row.traditional}</span>
              <span className="text-center font-semibold text-primary flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {row.ours}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Everything You Need, Nothing You Don't
            </h2>
            <p className="text-muted-foreground mt-2">
              Built for businesses that want Salesforce expertise without the overhead.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-primary/5 border border-primary/20 p-8 sm:p-12"
        >
          <Rocket className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Ready to Save on Salesforce Support?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join hundreds of businesses that switched to pay-as-you-go Salesforce services
            and cut their costs by over 60%.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="h-12 px-8 rounded-xl font-bold"
              onClick={() => navigate("/auth")}
            >
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 rounded-xl font-bold"
              onClick={() => navigate("/credits")}
            >
              Buy Credits
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
