"use client";

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  centered?: boolean;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "3xl": "max-w-[1200px]",
  full: "max-w-full",
};

export default function PageContainer({
  children,
  centered = false,
  className = "",
  maxWidth = "full",
}: PageContainerProps) {
  const baseClasses = "min-h-screen bg-[#0a0a0a] text-white bg-grid-pattern";
  const layoutClasses = centered ? "flex items-center justify-center px-4 py-12" : "px-6 py-10";

  const widthWrapper = `${maxWidthClasses[maxWidth]} mx-auto w-full`;
  const contentWrapper = [
    widthWrapper,
    centered ? "flex flex-col items-center text-center gap-4" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${baseClasses} ${layoutClasses}`}>
      <div className={contentWrapper}>{children}</div>
    </div>
  );
}

