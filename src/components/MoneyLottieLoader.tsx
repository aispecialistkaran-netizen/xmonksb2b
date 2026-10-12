"use client";

import React, { useEffect, useRef, useState } from "react";
import moneyAnimationData from "@/assets/Money.json";
import { animated, useSpring } from "@react-spring/web";
import { Sparkles, DollarSign, ArrowRight } from "lucide-react";

import lottie, { AnimationItem } from "lottie-web";

export interface MoneyLottieLoaderProps {
  /** Text to display under the animation */
  title?: string;
  /** Secondary subtitle or helper text */
  subtitle?: string;
  /** Whether this is a full-screen loader or tab overlay */
  mode?: "fullscreen" | "overlay";
  /** Duration in milliseconds (defaults to 2000ms as requested) */
  durationMs?: number;
  /** Callback fired when the timer finishes */
  onComplete?: () => void;
  /** Optional custom class names */
  className?: string;
}

export const MoneyLottieLoader: React.FC<MoneyLottieLoaderProps> = ({
  title = "Synchronizing Financial Workspace...",
  subtitle = "Optimizing live B2B pipeline & revenue records",
  mode = "overlay",
  durationMs = 2000,
  onComplete,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState<number>(0);

  // Smooth entrance & exit spring
  const fadeSpring = useSpring({
    from: { opacity: 0, transform: "scale(0.95)" },
    to: { opacity: 1, transform: "scale(1)" },
    config: { tension: 280, friction: 22 },
  });

  // 2-second smooth progress bar spring
  const progressSpring = useSpring({
    from: { width: "0%" },
    to: { width: "100%" },
    config: { duration: durationMs },
  });

  // Numeric percentage ticker from 0 to 100 over durationMs
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setPercent(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 40);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [durationMs, onComplete]);

  // Mount Lottie animation safely on client
  useEffect(() => {
    let animItem: AnimationItem | null = null;

    if (containerRef.current) {
      try {
        animItem = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: JSON.parse(JSON.stringify(moneyAnimationData)),
        });
      } catch (err) {
        console.warn("Failed to load Money.json Lottie animation:", err);
      }
    }

    return () => {
      if (animItem && typeof animItem.destroy === "function") {
        animItem.destroy();
      }
    };
  }, []);

  if (mode === "fullscreen") {
    return (
      <div className={`fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4 select-none ${className}`}>
        {/* Ambient gold/amber glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <animated.div
          style={fadeSpring}
          className="relative z-10 flex flex-col items-center text-center max-w-md w-full px-8 py-10 bg-slate-900/90 border border-amber-500/20 rounded-3xl shadow-[0_20px_60px_-15px_rgba(245,158,11,0.25)] backdrop-blur-xl"
        >
          {/* Lottie Money Coins Animation Container */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 -mt-4 mb-2 flex items-center justify-center">
            <div ref={containerRef} className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-h-full" />
            <div className="absolute bottom-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center space-x-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-300 tracking-wide uppercase">
                xMonks B2B Growth Engine
              </span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1.5">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs mb-6">
            {subtitle}
          </p>

          {/* Progress bar and counter */}
          <div className="w-full space-y-2">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
              <animated.div
                style={progressSpring}
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 px-1">
              <span className="flex items-center space-x-1 text-amber-400/90">
                <DollarSign className="w-3 h-3" />
                <span>Loading Assets...</span>
              </span>
              <span className="text-amber-400 font-mono font-bold">{percent}%</span>
            </div>
          </div>
        </animated.div>
      </div>
    );
  }

  // Overlay mode (e.g. while changing tabs)
  return (
    <div className={`fixed inset-0 z-[9990] bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none ${className}`}>
      {/* Subtle warm amber radial spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <animated.div
        style={fadeSpring}
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full px-7 py-8 bg-slate-900/95 border border-amber-500/30 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
      >
        {/* Lottie Money Coins Animation Container */}
        <div className="relative w-40 h-40 -mt-2 mb-1 flex items-center justify-center">
          <div ref={containerRef} className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-h-full" />
        </div>

        {/* Tab Switch Title */}
        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-bold tracking-wider uppercase mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Switching Views</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1">
            {subtitle}
          </p>
        </div>

        {/* 2-second Progress Bar */}
        <div className="w-full space-y-1.5">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <animated.div
              style={progressSpring}
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-medium text-slate-400 px-1">
            <span className="text-slate-400">Loading module...</span>
            <span className="text-amber-400 font-mono font-bold">{percent}%</span>
          </div>
        </div>
      </animated.div>
    </div>
  );
};
