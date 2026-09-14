import React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ScaleInCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const ScaleInCard: React.FC<ScaleInCardProps> = ({
  children,
  className,
  duration = 0.38,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.92 },
    animate: shouldReduceMotion
      ? { opacity: 1, transition: { duration, ease: "easeOut" } }
      : {
          opacity: 1,
          scale: 1,
          transition: {
            duration,
            ease: [0.16, 1, 0.3, 1] as const,
          },
        },
    exit: shouldReduceMotion
      ? { opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }
      : {
          opacity: 0,
          scale: 0.95,
          transition: {
            duration: 0.25,
            ease: "easeOut" as const,
          },
        },
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScaleInCard;
