"use client";

import React from "react";
import { useSpring, animated, useTrail } from "@react-spring/web";

/**
 * 1. Spring-powered continuous rotating spinner
 */
export const SpringSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string;
}> = ({ size = "md", className = "", color = "text-indigo-600 dark:text-indigo-400" }) => {
  const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[2.5px]",
    lg: "w-10 h-10 border-[3.5px]",
  };

  const spinProps = useSpring({
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
    loop: true,
    config: { duration: 900 },
  });

  return (
    <animated.div
      style={spinProps}
      className={`rounded-full border-solid border-current border-r-transparent ${sizeMap[size]} ${color} ${className}`}
    />
  );
};

/**
 * 2. Spring-pulsing breathing ring / orb
 */
export const SpringPulse: React.FC<{
  size?: number;
  color?: string;
  className?: string;
}> = ({ size = 48, color = "rgba(99, 102, 241, 0.25)", className = "" }) => {
  const pulseProps = useSpring({
    from: { transform: "scale(0.85)", opacity: 0.4 },
    to: async (next) => {
      while (true) {
        await next({ transform: "scale(1.25)", opacity: 0.9 });
        await next({ transform: "scale(0.85)", opacity: 0.4 });
      }
    },
    config: { tension: 120, friction: 14 },
  });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <animated.div
        style={{
          ...pulseProps,
          width: size,
          height: size,
          backgroundColor: color,
        }}
        className="rounded-full absolute"
      />
      <div
        style={{ width: size * 0.45, height: size * 0.45 }}
        className="rounded-full bg-indigo-600 dark:bg-indigo-400 relative z-10 shadow-md"
      />
    </div>
  );
};

/**
 * 3. Spring bouncing dots loader (e.g. "Loading...")
 */
export const SpringDots: React.FC<{
  size?: "sm" | "md";
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2.5 h-2.5";

  const trail = useTrail(3, {
    from: { transform: "translateY(0px)", opacity: 0.4 },
    to: async (next) => {
      while (true) {
        await next({ transform: "translateY(-6px)", opacity: 1 });
        await next({ transform: "translateY(0px)", opacity: 0.4 });
      }
    },
    config: { tension: 280, friction: 12 },
  });

  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      {trail.map((style, index) => (
        <animated.span
          key={index}
          style={style}
          className={`${dotSize} rounded-full bg-indigo-600 dark:bg-indigo-400`}
        />
      ))}
    </div>
  );
};

/**
 * 4. Spring Skeleton Shimmer for content loading
 */
export const SpringSkeleton: React.FC<{
  className?: string;
  height?: string | number;
  width?: string | number;
}> = ({ className = "", height, width }) => {
  const shimmerProps = useSpring({
    from: { opacity: 0.45 },
    to: async (next) => {
      while (true) {
        await next({ opacity: 0.85 });
        await next({ opacity: 0.45 });
      }
    },
    config: { duration: 1200 },
  });

  return (
    <animated.div
      style={{
        ...shimmerProps,
        height,
        width,
      }}
      className={`bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
    />
  );
};

/**
 * 5. Full Spring Portal Loading Screen
 */
export const SpringPortalLoader: React.FC<{ text?: string }> = ({
  text = "Loading xMonks B2B Workspace...",
}) => {
  const cardSpring = useSpring({
    from: { opacity: 0, transform: "scale(0.92) translateY(20px)" },
    to: { opacity: 1, transform: "scale(1) translateY(0px)" },
    config: { tension: 260, friction: 20 },
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <animated.div
        style={cardSpring}
        className="p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full space-y-4"
      >
        <SpringPulse size={56} />
        <div>
          <h3 className="text-sm font-black text-white tracking-wide">
            {text}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Synchronizing live CRM pipeline & directives
          </p>
        </div>
        <SpringDots />
      </animated.div>
    </div>
  );
};
