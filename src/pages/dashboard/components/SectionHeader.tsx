import { motion } from "framer-motion";
import { stagger } from "../constants";

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div {...stagger.item} className="space-y-0.5">
      <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
