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
  isImpact: boolean;
  showPaw: boolean;
}

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

      const startX = qRect ? qRect.left + qRect.width / 2 - 24 : window.innerWidth / 2 - 24;
      const startY = qRect ? qRect.top - 4 : 25;

      const targetRect = detail.targetRect;
      const targetX = targetRect.left + (targetRect.width > 90 ? 26 : targetRect.width / 2) - 24;
      const targetY = targetRect.top + targetRect.height / 2 - 12;

      const deltaX = targetX - startX;
      const deltaY = targetY - startY;
      // In Cute Doggie.json, scaleX(1) faces left (towards sidebar), scaleX(-1) faces right
      const facing = deltaX < 0 ? 1 : -1;
      const arcHeight = Math.min(160, Math.max(75, Math.abs(deltaX) * 0.22));

      // Temporarily hide the quote bar dog during jump
      setIsQuoteDogHidden(true);

      const flightDuration = 440;
      const flightStart = performance.now();

      const animateFlight = (now: number) => {
        const elapsed = now - flightStart;
        const p = Math.min(1, elapsed / flightDuration);
        const easedP = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

        const currX = startX + deltaX * easedP;
        const arc = -Math.sin(p * Math.PI) * arcHeight;
        const currY = startY + deltaY * p + arc;

        // Rotation tilt during leap
        const rot =
          facing === 1
            ? p < 0.35
              ? -18
              : p < 0.7
              ? -3
              : 20
            : p < 0.35
            ? 18
            : p < 0.7
            ? 3
            : -20;

        setLeapState({
          active: true,
          x: currX,
          y: currY,
          rotation: rot,
          facing,
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
            x: targetX,
            y: targetY,
            rotation: 0,
            facing,
            isImpact: true,
            showPaw: true,
          });

          // Trigger tab click & switch callback
          try {
            detail.onLand();
          } catch (err) {
            console.warn("Error invoking onLand:", err);
          }

          // Wag paws happily on tab for 240ms, then leap back to quote bar
          pauseTimerId = setTimeout(() => {
            const returnDuration = 380;
            const returnStart = performance.now();
            const returnFacing = facing === 1 ? -1 : 1; // Turn around to face quote bar

            const animateReturn = (retNow: number) => {
              const retElapsed = retNow - returnStart;
              const retP = Math.min(1, retElapsed / returnDuration);
              const retEasedP = retP < 0.5 ? 2 * retP * retP : -1 + (4 - 2 * retP) * retP;

              const rX = targetX + (startX - targetX) * retEasedP;
              const rArc = -Math.sin(retP * Math.PI) * (arcHeight * 0.75);
              const rY = targetY + (startY - targetY) * retP + rArc;

              const rRot =
                returnFacing === -1
                  ? retP < 0.35
                    ? 16
                    : retP < 0.7
                    ? 2
                    : -12
                  : retP < 0.35
                  ? -16
                  : retP < 0.7
                  ? -2
                  : 12;

              setLeapState({
                active: true,
                x: rX,
                y: rY,
                rotation: rRot,
                facing: returnFacing,
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
          }, 240);
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
      `}</style>

      <div
        className="relative hidden md:flex items-center space-x-2.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl shadow-2xs max-w-2xl xl:max-w-4xl transition-all hover:border-amber-300 dark:hover:border-amber-700 group flex-1 mt-1"
        title={`"${quoteData.quote}" — Click copy icon or refresh for a new one`}
      >
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
            transform: `translate3d(${leapState.x}px, ${leapState.y}px, 0) scaleX(${leapState.facing}) rotate(${leapState.rotation}deg)`,
            opacity: leapState.active ? 1 : 0,
            visibility: leapState.active ? "visible" : "hidden",
            transition: leapState.isImpact ? "transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
          }}
        >
          <div
            ref={leapingDogContainerRef}
            className="w-12 h-6 [&_svg]:w-full [&_svg]:h-full drop-shadow-lg"
            style={{
              transform: leapState.isImpact ? "scale(1.3, 0.82)" : "scale(1.2, 1.2)",
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
