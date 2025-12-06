"use client";

import { ReactNode } from "react";

interface SectionTitleProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  align?: "left" | "center";
  eyebrow?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function SectionTitle({
  title,
  description,
  align = "left",
  eyebrow,
  className = "",
  size = "md",
}: SectionTitleProps) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
  };

  return (
    <div className={`flex flex-col gap-2 ${alignment} ${className}`}>
      {eyebrow && <span className="text-xs font-semibold uppercase tracking-wide text-[#00ff88]">{eyebrow}</span>}
      <h2 className={`${sizeClasses[size]} font-bold text-white`}>{title}</h2>
      {description && <p className="text-sm text-gray-300 max-w-2xl">{description}</p>}
    </div>
  );
}

