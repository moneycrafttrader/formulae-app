"use client";

import React from "react";
import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "warning" | "purple" | "danger" | "success";
  href?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
};

export default function Button({
  children,
  variant = "primary",
  href,
  className,
  onClick,
  disabled = false,
  type = "button",
  fullWidth = false,
}: ButtonProps) {
  const baseStyles =
    "px-4 py-2 rounded-md font-medium transition-all duration-200";

  const variants = {
    primary: "bg-green-500 text-black hover:bg-green-400",
    secondary: "bg-gray-700 text-white hover:bg-gray-600",
    outline: "border border-gray-500 text-white hover:bg-gray-800",
    ghost: "text-gray-300 hover:text-white",
    warning: "bg-yellow-500 text-black hover:bg-yellow-400",
    purple: "bg-purple-600 text-white hover:bg-purple-500",
    danger: "bg-red-600 text-white hover:bg-red-500",
    success: "bg-green-600 text-white hover:bg-green-500",
  };

  const classes = [
    baseStyles,
    variants[variant],
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
