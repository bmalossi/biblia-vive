import React from "react";
import { cn } from "@/lib/utils";

export interface BorderGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
  className?: string;
  innerClassName?: string;
}

export const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className,
  innerClassName,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative rounded-3xl p-[1px] transition-shadow duration-500",
        "bg-gradient-to-b from-gold/50 via-gold/15 to-gold/35",
        "shadow-[0_0_35px_rgba(217,119,6,0.18)] dark:shadow-[0_0_40px_rgba(217,119,6,0.22)]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "w-full h-full rounded-[23px] bg-app-surface text-app-text overflow-hidden",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
