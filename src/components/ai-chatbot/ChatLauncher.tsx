import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type ChatLauncherProps = {
  onOpen: () => void;
};

export default function ChatLauncher({ onOpen }: ChatLauncherProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-5 right-5 z-50"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Button
          onClick={onOpen}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0 relative overflow-hidden group"
        >
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Bot className="h-6 w-6 text-primary-foreground relative z-10" />
          </motion.div>
        </Button>
      </motion.div>
    </motion.div>
  );
}
