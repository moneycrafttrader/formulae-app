"use client";

import { ReactNode } from "react";

type CardVariant = "light" | "dark" | "muted";
type CardMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "none";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  maxWidth?: CardMaxWidth;
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  light: "bg-[#101010]/80 border border-gray-800 text-white",
  dark: "bg-[#0b0b0b]/90 border border-gray-900 text-white",
  muted: "bg-[#151515]/70 border border-gray-800/70 text-gray-100",
};

const maxWidthClasses: Record<CardMaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  none: "",
};

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  variant = "light",
  className = "",
  maxWidth = "none",
  padding = "md",
  interactive = false,
}: CardProps) {
  const composedClasses = [
    "rounded-xl shadow-lg shadow-black/40 backdrop-blur",
    variantClasses[variant],
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    interactive ? "transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={composedClasses}>{children}</div>;
}

