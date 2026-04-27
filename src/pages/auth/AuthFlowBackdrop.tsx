import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { FLOW_STEPS } from "./constants";

export function AuthFlowBackdrop() {
  return (
    <div className="relative hidden min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-[#08111f] p-8 shadow-2xl lg:block">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <motion.div
        className="absolute inset-x-10 top-28 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
        animate={{ opacity: [0.25, 0.75, 0.25], x: [-24, 24, -24] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-24 left-16 right-16 h-px bg-gradient-to-r from-transparent via-sky-300/50 to-transparent"
        animate={{ opacity: [0.2, 0.65, 0.2], x: [28, -28, 28] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="max-w-[480px] space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            Secure client operations portal
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-semibold leading-tight text-white">
              From onboarding to delivery, every handoff stays visible.
            </h2>
            <p className="max-w-[430px] text-sm leading-6 text-slate-300">
              Customer Connect links partners, company admins, subscriptions, credits, tickets, and consultants in one controlled workflow.
            </p>
          </div>
        </div>

        <div className="relative mt-10 grid gap-4">
          <div className="absolute left-[27px] top-8 h-[calc(100%-64px)] w-px bg-gradient-to-b from-emerald-300/50 via-sky-300/30 to-teal-300/50" />
          {FLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                className="relative flex items-center gap-4"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.12, duration: 0.45 }}
              >
                <motion.div
                  className={`z-10 flex h-14 w-14 items-center justify-center rounded-2xl border ${step.border} ${step.bg}`}
                  animate={{ scale: [1, 1.06, 1], boxShadow: ["0 0 0 rgba(16,185,129,0)", "0 0 30px rgba(16,185,129,0.18)", "0 0 0 rgba(16,185,129,0)"] }}
                  transition={{ duration: 3.2, repeat: Infinity, delay: index * 0.35, ease: "easeInOut" }}
                >
                  <Icon className={`h-6 w-6 ${step.color}`} />
                </motion.div>
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 backdrop-blur-md">
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="text-xs text-slate-400">{step.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            ["Role-based access", "Admin controlled"],
            ["Subscription aware", "Credit-light flow"],
            ["Delivery ready", "Consultant path"],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <ShieldCheck className="mb-3 h-4 w-4 text-emerald-300" />
              <p className="text-xs font-semibold text-white">{title}</p>
              <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
