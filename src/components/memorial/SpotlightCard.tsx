import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  spotlightColor = "rgba(217, 119, 6, 0.15)",
  onMouseMove,
  style,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      divRef.current.style.setProperty("--mouse-x", `${x}px`);
      divRef.current.style.setProperty("--mouse-y", `${y}px`);
      divRef.current.style.setProperty("--spotlight-color", spotlightColor);
    }

    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-app-surface transition-all duration-200",
        "before:pointer-events-none before:absolute before:-inset-px before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100 focus-within:before:opacity-100",
        "before:[background:radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),var(--spotlight-color,rgba(217,119,6,0.15)),transparent_80%)]",
        className
      )}
      style={{
        ["--spotlight-color" as any]: spotlightColor,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
