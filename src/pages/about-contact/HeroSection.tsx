import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="border-b border-border-subtle bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight"
        >
          Get to Know Customer Connect
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
  );
}
