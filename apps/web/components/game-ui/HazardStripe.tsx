import React from "react";
import { cn } from "../../lib/cn";

type HazardStripeVariant = "warning" | "danger" | "info" | "success";

interface HazardStripeProps {
  variant?: HazardStripeVariant;
  height?: "sm" | "md" | "lg";
  className?: string;
}

const stripeClasses: Record<HazardStripeVariant, string> = {
  warning: "game-hazard-stripe-warning",
  danger: "game-hazard-stripe-danger",
  info: "game-hazard-stripe-info",
  success: "game-hazard-stripe-success",
};

const heightClasses: Record<string, string> = {
  sm: "h-1.5",
  md: "h-3",
  lg: "h-5",
};

const HazardStripe = ({
  variant = "warning",
  height = "md",
  className,
}: HazardStripeProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn(stripeClasses[variant], heightClasses[height], className)}
    />
  );
};

export default HazardStripe;
