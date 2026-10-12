"use client";

import React, { useState } from "react";
import { useSpring, animated, config } from "@react-spring/web";

export interface SpringButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "gradient" | "ghost" | "danger" | "success" | "custom";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  bounceScale?: number;
}

export const SpringButton = React.forwardRef<HTMLButtonElement, SpringButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      bounceScale = 0.96,
      className = "",
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    // Spring physics configuration
    const springProps = useSpring({
      transform: isPressed
        ? `scale(${bounceScale}) translateY(1px)`
        : isHovered && !disabled && !isLoading
        ? `scale(1.025) translateY(-1.5px)`
        : `scale(1) translateY(0px)`,
      boxShadow:
        isHovered && !disabled && !isLoading
          ? "0 10px 25px -5px rgba(99, 102, 241, 0.35), 0 8px 10px -6px rgba(99, 102, 241, 0.2)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      config: {
        tension: 400,
        friction: 17,
      },
    });

    // Variant styling
    const variantStyles = {
      primary:
        "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-sm",
      gradient:
        "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white border-transparent shadow-md",
      secondary:
        "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
      ghost:
        "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent",
      danger:
        "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-transparent shadow-md",
      success:
        "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-transparent shadow-md",
      custom: "",
    };

    // Size styling
    const sizeStyles = {
      sm: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
      md: "px-3.5 py-2 text-xs font-bold rounded-xl gap-2",
      lg: "px-5 py-2.5 text-sm font-black rounded-2xl gap-2.5",
    };

    return (
      <animated.button
        ref={ref}
        style={springProps}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`inline-flex items-center justify-center font-bold transition-colors select-none cursor-pointer border ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${
          disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>{loadingText || "Loading..."}</span>
          </>
        ) : (
          children
        )}
      </animated.button>
    );
  }
);

SpringButton.displayName = "SpringButton";
