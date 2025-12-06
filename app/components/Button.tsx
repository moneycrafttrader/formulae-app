"use client";

import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "purple" | "outline";

interface BaseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
}

interface ButtonAsButton extends BaseButtonProps, ButtonHTMLAttributes<HTMLButtonElement> {
  as?: "button";
  href?: never;
}

interface ButtonAsLink extends BaseButtonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  as: "a";
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#00ff88] hover:bg-[#00cc6f] text-black border border-[#00ff88] shadow-lg shadow-[#00ff88]/30",
  secondary: "bg-[#141414] hover:bg-[#1f1f1f] text-white border border-gray-700",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500",
  danger: "bg-red-600 hover:bg-red-500 text-white border border-red-500",
  warning: "bg-yellow-400 hover:bg-yellow-300 text-black border border-yellow-300",
  purple: "bg-gradient-to-r from-purple-700 to-indigo-700 text-white border border-purple-600",
  outline:
    "bg-transparent text-[#00ff88] border border-[#00ff88] hover:bg-[#00ff88]/10 hover:text-black",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff88] disabled:opacity-60 disabled:cursor-not-allowed";

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const composedClasses = [
    baseClasses,
    "px-4 py-2.5 text-sm",
    variantClasses[variant],
    fullWidth ? "w-full" : "w-fit",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (props.as === "a" && "href" in props) {
    const { as, ...linkProps } = props;
    return (
      <Link href={linkProps.href} className={composedClasses} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={composedClasses} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

