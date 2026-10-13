"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import lottie, { AnimationItem } from "lottie-web";

interface QuoteData {
  quote: string;
  tag: string;
  timestamp: string;
}

const STORAGE_KEY = "xmonks_sales_quote_v1";
const ROTATION_INTERVAL_MS = 10 * 1000; // 10 seconds rotation

const DEFAULT_QUOTE: QuoteData = {
  quote: "May your coffee be strong and your pipeline follow-ups be warm today ☕",
  tag: "Morning Fuel",
  timestamp: new Date().toISOString(),
};

interface LeapState {
  active: boolean;
  x: number;
  y: number;
  rotation: number;
  facing: number;
  scale: number;
  shadowBlur: number;
  isImpact: boolean;
  showPaw: boolean;
}

// Scenic Background Tree Components for the Continuous Running Path
const PineTree: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`h-6 w-auto ${className}`} viewBox="0 0 24 32" fill="none">
    <rect x="10.5" y="24" width="3" height="7" rx="1" className="fill-amber-900/80 dark:fill-amber-950" />
    <polygon points="12,2 4,12 8,12 3,19 9,19 5,25 19,25 15,19 21,19 16,12 20,12" className="fill-emerald-600 dark:fill-emerald-700/70" />
    <polygon points="12,2 4,12 12,12 7,19 12,19 8,25 12,25" className="fill-emerald-500 dark:fill-emerald-600/70 opacity-90" />
  </svg>
);

const RoundOakTree: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`h-6 w-auto ${className}`} viewBox="0 0 28 32" fill="none">
    <rect x="12" y="22" width="4" height="9" rx="1.5" className="fill-amber-900/80 dark:fill-amber-950" />
    <circle cx="14" cy="13" r="10" className="fill-emerald-500 dark:fill-emerald-600/70" />
    <circle cx="9" cy="16" r="7" className="fill-green-600 dark:fill-emerald-800/70" />
    <circle cx="19" cy="16" r="7" className="fill-teal-600 dark:fill-teal-700/70" />
    <circle cx="14" cy="9" r="6" className="fill-emerald-400 dark:fill-emerald-500/70 opacity-80" />
  </svg>
);

const SlenderCypress: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`h-6 w-auto ${className}`} viewBox="0 0 18 32" fill="none">
    <rect x="7.5" y="24" width="3" height="7" rx="1" className="fill-amber-900/80 dark:fill-amber-950" />
    <path d="M9 3 C5 10 4 24 9 24 C14 24 13 10 9 3 Z" className="fill-teal-600 dark:fill-teal-700/70" />
    <path d="M9 3 C5 10 6 24 9 24 Z" className="fill-teal-500 dark:fill-teal-600/70 opacity-80" />
  </svg>
);

const AutumnMapleTree: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`h-6 w-auto ${className}`} viewBox="0 0 26 32" fill="none">
    <rect x="11.5" y="22" width="3" height="9" rx="1" className="fill-amber-950" />
    <circle cx="13" cy="13" r="9" className="fill-amber-500 dark:fill-amber-600/70" />
    <circle cx="8" cy="15" r="6" className="fill-orange-500 dark:fill-orange-600/70" />
    <circle cx="17" cy="15" r="6" className="fill-yellow-500 dark:fill-yellow-600/70 opacity-90" />
    <circle cx="13" cy="9" r="5" className="fill-amber-400 dark:fill-amber-500/70 opacity-90" />
  </svg>
);

const FloweringBush: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`h-4 w-auto ${className}`} viewBox="0 0 20 18" fill="none">
    <path d="M3 16 C1 13 2 9 6 8 C7 5 11 5 13 7 C17 6 19 11 18 16 Z" className="fill-emerald-600 dark:fill-emerald-700/70" />
    <circle cx="7" cy="11" r="1.2" className="fill-amber-300 dark:fill-amber-400" />
    <circle cx="13" cy="10" r="1.2" className="fill-rose-300 dark:fill-rose-400" />
    <circle cx="10" cy="13" r="1" className="fill-white/90" />
  </svg>
);

export const SalesQuoteBanner: React.FC = () => {
  const [quoteData, setQuoteData] = useState<QuoteData>(DEFAULT_QUOTE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0);
  const [isQuoteDogHidden, setIsQuoteDogHidden] = useState<boolean>(false);

  // Leaping dog state
  const [leapState, setLeapState] = useState<LeapState>({
    active: false,
    x: 0,
    y: 0,
    rotation: 0,
    facing: 1,
    scale: 1,
    shadowBlur: 4,
    isImpact: false,
    showPaw: false,
  });

  const dogContainerRef = useRef<HTMLDivElement>(null);
  const leapingDogContainerRef = useRef<HTMLDivElement>(null);

  // Mount Lottie cute doggie walk-cycle animation for both patrol and leaping dogs
  useEffect(() => {
    let animItem: AnimationItem | null = null;
    let leapingAnimItem: AnimationItem | null = null;
    let isCancelled = false;

    fetch("/Cute%20Doggie.json")
      .then((res) => res.json())
      .then((animationData) => {
        if (!isCancelled) {
          if (dogContainerRef.current) {
            animItem = lottie.loadAnimation({
              container: dogContainerRef.current,
              renderer: "svg",
              loop: true,
              autoplay: true,
              animationData,
            });
          }
          if (leapingDogContainerRef.current) {
            leapingAnimItem = lottie.loadAnimation({
              container: leapingDogContainerRef.current,
              renderer: "svg",
              loop: true,
              autoplay: true,
              animationData,
            });
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to load Cute Doggie.json:", err);
      });

    return () => {
      isCancelled = true;
      if (animItem && typeof animItem.destroy === "function") {
        animItem.destroy();
      }
      if (leapingAnimItem && typeof leapingAnimItem.destroy === "function") {
        leapingAnimItem.destroy();
      }
    };
  }, []);

  // Listen for tab switch events and trigger the cute dog jump across the screen
  useEffect(() => {
    let animFrameId: number | null = null;
    let pauseTimerId: NodeJS.Timeout | null = null;

    const handleDogJump = (e: Event) => {
      const customEvent = e as CustomEvent<{
        tab: string;
        tabLabel?: string;
        targetRect: DOMRect;
        onLand: () => void;
      }>;
      const detail = customEvent.detail;
      if (!detail || !detail.targetRect) return;

      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (pauseTimerId) clearTimeout(pauseTimerId);

      const quoteDogEl = document.getElementById("sales-quote-running-dog");
      const qRect = quoteDogEl?.getBoundingClientRect();

      // Safe viewport boundary margins (keeps dog 100% inside visible screen viewport)
      const SAFE_MIN_Y = 18;
      const SAFE_MAX_Y = Math.max(300, (window.innerHeight || 800) - 55);
      const SAFE_MIN_X = 12;
      const SAFE_MAX_X = Math.max(300, (window.innerWidth || 1200) - 60);

      const startX = qRect ? qRect.left + qRect.width / 2 - 24 : window.innerWidth / 2 - 24;
      const startY = qRect ? Math.max(SAFE_MIN_Y + 12, qRect.top - 4) : 34;

      const targetRect = detail.targetRect;
      const targetX = targetRect.left + (targetRect.width > 90 ? 26 : targetRect.width / 2) - 24;
      const targetY = targetRect.top + targetRect.height / 2 - 12;

      const deltaX = targetX - startX;
      const deltaY = targetY - startY;
      // In Cute Doggie.json, scaleX(1) faces left (towards sidebar), scaleX(-1) faces right
      const facing = deltaX < 0 ? 1 : -1;

      // Calculate max upward arc that guarantees currY never rises above SAFE_MIN_Y
      const midLinearY = startY + deltaY * 0.5;
      const maxAllowedUpwardArc = Math.max(0, midLinearY - SAFE_MIN_Y);
      const arcHeight = Math.min(maxAllowedUpwardArc, Math.max(20, Math.abs(deltaX) * 0.16));

      // Temporarily hide the quote bar dog during jump
      setIsQuoteDogHidden(true);

      // Smooth slow 4.5s cinematic jump arc
      const flightDuration = 4500;
      const flightStart = performance.now();

      const animateFlight = (now: number) => {
        const elapsed = now - flightStart;
        const p = Math.min(1, elapsed / flightDuration);

        // Butter-smooth cosine ease-in-out curve
        const easedP = 0.5 - 0.5 * Math.cos(p * Math.PI);

        // Coordinates strictly clamped within safe viewport boundaries
        const rawX = startX + deltaX * easedP;
        const rawY = startY + deltaY * p - Math.sin(p * Math.PI) * arcHeight;
        const currX = Math.max(SAFE_MIN_X, Math.min(SAFE_MAX_X, rawX));
        const currY = Math.max(SAFE_MIN_Y, Math.min(SAFE_MAX_Y, rawY));

        // 3D Zoom In & Zoom Out effect:
        // At takeoff (p=0): normal size (1.05x)
        // At mid-flight apex (p=0.5): zooms in up to ~2.2x closer to the user/screen!
        // At landing (p=1.0): zooms back out to 1.05x cleanly onto the tab!
        const zoomScale = 1.05 + Math.sin(p * Math.PI) * 1.15;
        const shadowBlur = 4 + Math.sin(p * Math.PI) * 16;

        // Continuous smooth rotation tilt during the 4-5s leap
        let rot: number;
        if (p < 0.4) {
          // Tilting upwards into the leap (-22deg -> 0deg)
          rot = -22 * (1 - p / 0.4);
        } else if (p < 0.7) {
          // Gliding through mid-flight apex (-2deg -> +6deg)
          rot = -2 + 8 * ((p - 0.4) / 0.3);
        } else {
          // Graceful dive downward onto the tab (+6deg -> +24deg)
          rot = 6 + 18 * ((p - 0.7) / 0.3);
        }
        if (facing !== 1) rot = -rot;

        setLeapState({
          active: true,
          x: currX,
          y: currY,
          rotation: rot,
          facing,
          scale: zoomScale,
          shadowBlur,
          isImpact: false,
          showPaw: false,
        });

        if (p < 1) {
          animFrameId = requestAnimationFrame(animateFlight);
        } else {
          // ==============================
          // LANDED ON TAB & CLICK!
          // ==============================
          setLeapState({
            active: true,
            x: Math.max(SAFE_MIN_X, Math.min(SAFE_MAX_X, targetX)),
            y: Math.max(SAFE_MIN_Y, Math.min(SAFE_MAX_Y, targetY)),
            rotation: 0,
            facing,
            scale: 1.05,
            shadowBlur: 4,
            isImpact: true,
            showPaw: true,
          });

          // Trigger tab click & switch callback
          try {
            detail.onLand();
          } catch (err) {
            console.warn("Error invoking onLand:", err);
          }

          // Wag paws happily on tab for 700ms, then smoothly leap back to quote bar
          pauseTimerId = setTimeout(() => {
            const returnDuration = 3200;
            const returnStart = performance.now();
            const returnFacing = facing === 1 ? -1 : 1; // Turn around to face quote bar

            const animateReturn = (retNow: number) => {
              const retElapsed = retNow - returnStart;
              const retP = Math.min(1, retElapsed / returnDuration);
              const retEasedP = 0.5 - 0.5 * Math.cos(retP * Math.PI);

              const rawReturnX = targetX + (startX - targetX) * retEasedP;
              const rawReturnY = targetY + (startY - targetY) * retP - Math.sin(retP * Math.PI) * (arcHeight * 0.75);
              const rX = Math.max(SAFE_MIN_X, Math.min(SAFE_MAX_X, rawReturnX));
              const rY = Math.max(SAFE_MIN_Y, Math.min(SAFE_MAX_Y, rawReturnY));

              // Zoom in / zoom out on return flight
              const returnZoomScale = 1.05 + Math.sin(retP * Math.PI) * 0.95;
              const returnShadowBlur = 4 + Math.sin(retP * Math.PI) * 12;

              let rRot: number;
              if (retP < 0.4) {
                rRot = 18 * (1 - retP / 0.4);
              } else if (retP < 0.7) {
                rRot = 2 - 8 * ((retP - 0.4) / 0.3);
              } else {
                rRot = -6 - 12 * ((retP - 0.7) / 0.3);
              }
              if (returnFacing !== -1) rRot = -rRot;

              setLeapState({
                active: true,
                x: rX,
                y: rY,
                rotation: rRot,
                facing: returnFacing,
                scale: returnZoomScale,
                shadowBlur: returnShadowBlur,
                isImpact: false,
                showPaw: false,
              });

              if (retP < 1) {
                animFrameId = requestAnimationFrame(animateReturn);
              } else {
                // Return complete! Re-enable quote bar dog
                setLeapState((prev) => ({ ...prev, active: false }));
                setIsQuoteDogHidden(false);
              }
            };

            animFrameId = requestAnimationFrame(animateReturn);
          }, 700);
        }
      };

      animFrameId = requestAnimationFrame(animateFlight);
    };

    window.addEventListener("dog-jump-to-tab", handleDogJump);
    return () => {
      window.removeEventListener("dog-jump-to-tab", handleDogJump);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (pauseTimerId) clearTimeout(pauseTimerId);
    };
  }, []);

  const fetchNewQuote = useCallback(async (isManual: boolean = false) => {
    setIsFading(true);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/quotes/random?force=${isManual ? "true" : "false"}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quote) {
          setTimeout(() => {
            const freshData: QuoteData = {
              quote: data.quote,
              tag: data.tag || "Sales Wisdom",
              timestamp: new Date().toISOString(),
            };
            setQuoteData(freshData);
            setIsFading(false);

            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
              } catch {}
            }
          }, 180);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch fresh quote:", err);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsFading(false), 220);
    }
  }, []);

  // 10-second automatic rotation
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNewQuote(false);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchNewQuote, timerKey]);

  const handleManualRefresh = () => {
    setTimerKey((prev) => prev + 1); // Reset the 10-second timer
    fetchNewQuote(true);
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`"${quoteData.quote}" — ${quoteData.tag}`).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  return (
    <>
      {/* Keyframe animation for doggie running across the top of the quote bar */}
      <style jsx>{`
        @keyframes dogTrotPatrol {
          0% {
            left: 2px;
            transform: scaleX(-1);
          }
          48% {
            left: calc(100% - 50px);
            transform: scaleX(-1);
          }
          50% {
            left: calc(100% - 50px);
            transform: scaleX(1);
          }
          98% {
            left: 2px;
            transform: scaleX(1);
          }
          100% {
            left: 2px;
            transform: scaleX(-1);
          }
        }
        @keyframes treeSway {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(2deg);
          }
        }
        .tree-sway-1 {
          animation: treeSway 4.5s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .tree-sway-2 {
          animation: treeSway 5.5s ease-in-out infinite 1.2s;
          transform-origin: bottom center;
        }
        .tree-sway-3 {
          animation: treeSway 4s ease-in-out infinite 2.5s;
          transform-origin: bottom center;
        }
        .tree-sway-4 {
          animation: treeSway 6s ease-in-out infinite 0.7s;
          transform-origin: bottom center;
        }
      `}</style>

      <div
        className="relative hidden md:flex items-center space-x-2.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl shadow-2xs max-w-2xl xl:max-w-4xl transition-all hover:border-amber-300 dark:hover:border-amber-700 group flex-1 mt-1"
        title={`"${quoteData.quote}" — Click copy icon or refresh for a new one`}
      >
        {/* Scenic Background Trees Layer along the continuous dog running path (behind running dog) */}
        <div className="absolute -top-[23px] left-3 right-3 h-6 pointer-events-none overflow-hidden z-10 flex items-end justify-between select-none opacity-85 dark:opacity-75">
          <PineTree className="tree-sway-1" />
          <FloweringBush className="tree-sway-3 hidden sm:block" />
          <RoundOakTree className="tree-sway-2" />
          <SlenderCypress className="tree-sway-4 hidden md:block" />
          <AutumnMapleTree className="tree-sway-1" />
          <FloweringBush className="tree-sway-2" />
          <RoundOakTree className="tree-sway-3" />
          <PineTree className="tree-sway-4 hidden sm:block" />
          <SlenderCypress className="tree-sway-1" />
          <FloweringBush className="tree-sway-3 hidden lg:block" />
          <AutumnMapleTree className="tree-sway-2 hidden xl:block" />
          <RoundOakTree className="tree-sway-4" />
          <PineTree className="tree-sway-2" />
        </div>

        {/* Cute Running Doggie above the quote bar with comfortable headroom */}
        <div className="absolute -top-[23px] left-2 right-2 h-6 pointer-events-none overflow-visible z-20">
          <div
            id="sales-quote-running-dog"
            className="absolute top-0 w-12 h-6 transition-opacity duration-150"
            style={{
              animation: "dogTrotPatrol 10s ease-in-out infinite",
              opacity: isQuoteDogHidden ? 0 : 1,
            }}
          >
            <div
              ref={dogContainerRef}
              className="w-full h-full [&_svg]:w-full [&_svg]:h-full drop-shadow-xs"
            />
          </div>
        </div>

        {/* 🐾 Leaping Dog Floating Portal (Jumps from quote bar onto clicked tab and clicks it) */}
        <div
          className="fixed top-0 left-0 pointer-events-none z-[999999] will-change-transform"
          style={{
            transform: `translate3d(${leapState.x}px, ${leapState.y}px, 0) scaleX(${leapState.facing}) rotate(${leapState.rotation}deg) scale(${leapState.scale})`,
            opacity: leapState.active ? 1 : 0,
            visibility: leapState.active ? "visible" : "hidden",
            transition: leapState.isImpact ? "transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
          }}
        >
          <div
            ref={leapingDogContainerRef}
            className="w-12 h-6 [&_svg]:w-full [&_svg]:h-full"
            style={{
              transform: leapState.isImpact ? "scale(1.3, 0.82)" : "scale(1.15, 1.15)",
              filter: `drop-shadow(0 ${Math.max(2, leapState.shadowBlur * 0.55)}px ${leapState.shadowBlur}px rgba(0,0,0,0.35))`,
              transition: "transform 0.1s ease",
            }}
          />

          {/* Floating Paw Click Ripple & Bark Bubble */}
          {leapState.showPaw && (
            <div className="absolute -top-7 -left-3 flex items-center gap-1 bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xl border-2 border-amber-300 animate-in zoom-in-75 fade-in duration-150 whitespace-nowrap">
              <span className="text-xs">🐾</span>
              <span>Click!</span>
            </div>
          )}
        </div>

        {/* Icon Pill */}
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        {/* Quote Content with 10s Crossfade Transition */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <p
            className={`text-xs font-medium italic text-slate-800 dark:text-slate-200 leading-snug transition-all duration-200 ${
              isFading ? "opacity-0 -translate-y-0.5" : "opacity-100 translate-y-0"
            }`}
          >
            &ldquo;{quoteData.quote}&rdquo;
          </p>

          {quoteData.tag && (
            <span
              className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/80 shrink-0 transition-opacity duration-200 ${
                isFading ? "opacity-30" : "opacity-100"
              }`}
            >
              {quoteData.tag}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition cursor-pointer"
            title={isCopied ? "Copied to clipboard!" : "Copy quote"}
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>

          {/* Get New One Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 hover:bg-amber-200/80 dark:bg-amber-900/40 dark:hover:bg-amber-900/70 border border-amber-200/80 dark:border-amber-800/80 transition cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
            title="Get another motivational or funny quote"
          >
            <RefreshCw
              className={`w-3 h-3 ${isLoading ? "animate-spin text-amber-600 dark:text-amber-400" : ""}`}
            />
            <span className="hidden lg:inline">{isLoading ? "Rolling..." : "Get new one"}</span>
          </button>
        </div>
      </div>
    </>
  );
};
