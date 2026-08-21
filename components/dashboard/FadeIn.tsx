"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  /** Seconds to wait before starting (for stagger). */
  delay?: number;
  className?: string;
}

/** Subtle fade-up entrance; collapses to a plain fade under reduced motion. */
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0.2, delay }
          : { type: "spring", stiffness: 260, damping: 28, delay }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
