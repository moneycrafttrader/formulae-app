"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  optional?: boolean;
  fullWidth?: boolean;
}

const baseInputClasses =
  "w-full rounded-md border bg-[#111111] border-gray-700/80 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 transition focus:border-[#00ff88] focus:ring-2 focus:ring-[#00ff88] disabled:cursor-not-allowed disabled:opacity-60";

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, description, error, optional = false, fullWidth = true, className = "", id, name, ...props },
  ref,
) {
  const inputId = id ?? name;
  const composedClasses = [
    baseInputClasses,
    error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor={inputId} className="text-sm font-medium text-white">
            {label}
          </label>
          {optional && <span className="text-xs text-gray-400">Optional</span>}
        </div>
      )}

      <input ref={ref} id={inputId} name={name} className={composedClasses} {...props} />

      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Input;

