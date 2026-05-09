"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cosmic" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "cosmic", size = "md", loading, disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cosmos-purple-bright focus:ring-offset-2 focus:ring-offset-cosmos-deep disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

    const variants = {
      cosmic: "btn-cosmic text-white",
      outline: "border border-cosmos-purple-bright/40 text-cosmos-purple-light hover:border-cosmos-purple-bright hover:bg-cosmos-purple-bright/10 hover:shadow-nebula",
      ghost: "text-cosmos-dust hover:text-cosmos-star hover:bg-white/5",
      danger: "bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 hover:border-red-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
