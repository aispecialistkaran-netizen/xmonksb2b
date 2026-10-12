"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Sparkles, Award, ShieldCheck, TrendingUp, IndianRupee } from "lucide-react";

export interface ProjectProgressBarProps {
  percent: number; // 0 - 100
  onPercentChange?: (newPercent: number) => void;
  showControls?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  editable?: boolean;
  className?: string;
}

/**
 * High-definition SVG Currency Note Token
 */
const CurrencyNoteIcon: React.FC<{ percent: number; isCompact?: boolean }> = ({
  percent,
  isCompact = false,
}) => {
  if (isCompact) {
    return (
      <div className="relative flex items-center justify-center filter drop-shadow-sm transition-transform duration-300 hover:scale-110">
        <svg
          viewBox="0 0 38 22"
          className="w-8 h-[18px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Banknote Outer Body */}
          <rect
            x="1"
            y="1"
            width="36"
            height="20"
            rx="3"
            fill="#065f46"
            stroke="#10b981"
            strokeWidth="1.2"
          />
          {/* Inner Security Border */}
          <rect
            x="3.5"
            y="3.5"
            width="31"
            height="15"
            rx="2"
            fill="#047857"
            stroke="#6ee7b7"
            strokeWidth="0.6"
            strokeDasharray="2 1"
          />
          {/* Center Currency Rosette */}
          <circle cx="19" cy="11" r="5.5" fill="#065f46" stroke="#a7f3d0" strokeWidth="0.8" />
          {/* Rupee Symbol */}
          <text
            x="19"
            y="14.2"
            textAnchor="middle"
            fill="#ecfdf5"
            fontSize="8"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            ₹
          </text>
          {/* Corner Denomination Marks */}
          <circle cx="6" cy="6" r="1.2" fill="#a7f3d0" />
          <circle cx="32" cy="16" r="1.2" fill="#a7f3d0" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center filter drop-shadow-md transition-transform duration-300 hover:scale-105">
      <svg
        viewBox="0 0 64 36"
        className="w-14 sm:w-16 h-8 sm:h-9 select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Banknote Outer Body with Gradient */}
        <defs>
          <linearGradient id="noteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="50%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="goldStrip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        <rect
          x="1.5"
          y="1.5"
          width="61"
          height="33"
          rx="4"
          fill="url(#noteGrad)"
          stroke="#34d399"
          strokeWidth="1.5"
        />

        {/* Guilloche/Security Inner Frame */}
        <rect
          x="4.5"
          y="4.5"
          width="55"
          height="27"
          rx="3"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="0.8"
          strokeDasharray="3 1.5"
        />

        {/* Security Metallic Foil Thread */}
        <rect x="42" y="2" width="2.5" height="32" fill="url(#goldStrip)" opacity="0.9" />

        {/* Center Denomination Medallion */}
        <circle cx="26" cy="18" r="9" fill="#065f46" stroke="#a7f3d0" strokeWidth="1" />
        <circle cx="26" cy="18" r="7" fill="none" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5 1" />

        {/* Rupee Symbol */}
        <text
          x="26"
          y="22.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          ₹
        </text>

        {/* Mini percentage value on note */}
        <text
          x="53"
          y="11"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="6.5"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          {percent}%
        </text>

        <text
          x="11"
          y="30"
          textAnchor="middle"
          fill="#a7f3d0"
          fontSize="5"
          fontWeight="bold"
          fontFamily="monospace"
        >
          XM
        </text>
      </svg>
    </div>
  );
};

export const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  percent = 0,
  onPercentChange,
  showControls = true,
  title = "Project Work Completion",
  subtitle,
  compact = false,
  editable = true,
  className = "",
}) => {
  const [clampedPercent, setClampedPercent] = useState<number>(() =>
    Math.max(0, Math.min(100, Math.round(percent)))
  );

  useEffect(() => {
    setClampedPercent(Math.max(0, Math.min(100, Math.round(percent))));
  }, [percent]);

  const handleSliderChange = (newVal: number) => {
    const val = Math.max(0, Math.min(100, Math.round(newVal)));
    setClampedPercent(val);
    if (onPercentChange) {
      onPercentChange(val);
    }
  };

  const getStatusText = (pct: number) => {
    if (pct === 100) return "100% Fully Delivered & Signed Off";
    if (pct >= 80) return "Phase 4: Final Sign-off & Handover";
    if (pct >= 60) return "Phase 3: Core Program Execution";
    if (pct >= 40) return "Phase 2: Milestone Implementation";
    if (pct >= 20) return "Phase 1: Project Kickoff & Diagnostic";
    if (pct > 0) return "Delivery Mobilization";
    return "Not Started";
  };

  const getStatusBadge = (pct: number) => {
    if (pct === 100) {
      return {
        bg: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
        label: "Delivered & Verified",
      };
    }
    if (pct >= 60) {
      return {
        bg: "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
        label: "Advanced Execution",
      };
    }
    if (pct >= 20) {
      return {
        bg: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        label: "In Progress",
      };
    }
    return {
      bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      label: "Pending Kickoff",
    };
  };

  const statusBadge = getStatusBadge(clampedPercent);

  // --------------------------------------------------------------------------
  // COMPACT MODE: Designed for Table Cells (Sleek, responsive, banknote-styled)
  // --------------------------------------------------------------------------
  if (compact) {
    return (
      <div className={`w-full min-w-[120px] max-w-[220px] space-y-1.5 ${className}`}>
        {/* Header row in table cell */}
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-800 dark:text-slate-200 flex items-center space-x-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              {clampedPercent}%
            </span>
            {clampedPercent === 100 && (
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            )}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[90px] font-medium">
            {clampedPercent === 100 ? "Delivered" : `${clampedPercent}% Done`}
          </span>
        </div>

        {/* Currency Note Styled Progress Runway */}
        <div className="relative w-full h-5 rounded-lg bg-emerald-950/10 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 p-0.5 flex items-center overflow-visible">
          {/* Banknote Micro Guilloche Pattern Background */}
          <div
            className="absolute inset-0 rounded-lg opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(16, 185, 129, 0.15) 4px, rgba(16, 185, 129, 0.15) 8px)",
            }}
          />

          {/* Filled Currency Ink Level */}
          <div
            className="h-full rounded-md transition-all duration-500 ease-out relative overflow-hidden"
            style={{
              width: `${Math.max(4, clampedPercent)}%`,
              background:
                "linear-gradient(90deg, #059669 0%, #10b981 60%, #34d399 100%)",
            }}
          >
            {/* Shimmering Metallic Thread on Filled Area */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.5s infinite linear",
              }}
            />
          </div>

          {/* Sliding Mini Currency Note Token */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-500 ease-out z-10"
            style={{
              left: `${Math.max(6, Math.min(94, clampedPercent))}%`,
            }}
          >
            <CurrencyNoteIcon percent={clampedPercent} isCompact />
          </div>

          {/* 100% Target Coin Stamp at the far right */}
          <div
            className={`absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border transition ${
              clampedPercent === 100
                ? "bg-amber-400 text-amber-950 border-amber-300 shadow-xs"
                : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
            }`}
            title="100% Delivery Target"
          >
            ₹
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // HERO MODE: Interactive Currency Banknote Workspace Component
  // --------------------------------------------------------------------------
  return (
    <div
      className={`w-full rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-emerald-950/10 via-slate-50 to-teal-950/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-950 border-2 border-emerald-500/30 dark:border-emerald-600/40 shadow-xl space-y-5 transition-all ${className}`}
    >
      {/* Top Banknote Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/60">
        <div className="flex items-center space-x-3">
          {/* Currency Emblem */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 text-lg shrink-0">
            ₹
          </div>

          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h4>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center space-x-1 ${statusBadge.bg}`}
              >
                {clampedPercent === 100 ? (
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                <span>{statusBadge.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle || getStatusText(clampedPercent)}
            </p>
          </div>
        </div>

        {/* Currency Note Serial & Realized Percentage Display */}
        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
              XM-B2B-2026 • NOTE
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 leading-none flex items-center justify-end space-x-0.5">
              <span>{clampedPercent}%</span>
            </div>
          </div>

          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black border transition ${
              clampedPercent === 100
                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 shadow-md ring-2 ring-amber-400/20"
                : "bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            }`}
          >
            {clampedPercent === 100 ? (
              <Award className="w-6 h-6 animate-pulse" />
            ) : (
              <IndianRupee className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* AUTHENTIC BANKNOTE PROGRESS RUNWAY CANVAS */}
      {/* ========================================================= */}
      <div className="relative p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-300/60 dark:border-emerald-700/60 shadow-inner overflow-hidden space-y-3">
        {/* Banknote Micro-Pattern Watermark */}
        <div
          className="absolute inset-0 opacity-15 dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#059669 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 8px 8px",
          }}
        />

        {/* Banknote Security Frame Header */}
        <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-emerald-800 dark:text-emerald-400 opacity-70">
          <span>RESERVE VALUE DELIVERY NOTE</span>
          <span>100% CONTRACT RATIO</span>
        </div>

        {/* Interactive / Animated Progress Bar Track */}
        <div className="relative w-full h-8 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-emerald-400/50 dark:border-emerald-700/60 p-1 flex items-center overflow-visible shadow-xs">
          {/* Filled Currency Green Gradient with Security Thread */}
          <div
            className="h-full rounded-lg transition-all duration-500 ease-out relative overflow-hidden shadow-sm"
            style={{
              width: `${Math.max(3, clampedPercent)}%`,
              background:
                "linear-gradient(90deg, #047857 0%, #059669 40%, #10b981 85%, #34d399 100%)",
            }}
          >
            {/* Animated Metallic Holographic Strip */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent 0%, rgba(254, 240, 138, 0.7) 45%, rgba(255,255,255,0.9) 50%, rgba(254, 240, 138, 0.7) 55%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.8s infinite linear",
              }}
            />
          </div>

          {/* Gliding Currency Note Indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-500 ease-out z-20"
            style={{
              left: `${Math.max(5, Math.min(95, clampedPercent))}%`,
            }}
          >
            <CurrencyNoteIcon percent={clampedPercent} />
          </div>

          {/* 100% Target Seal Marker */}
          <div
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border transition ${
              clampedPercent === 100
                ? "bg-amber-400 text-amber-950 border-amber-500 shadow-md scale-110"
                : "bg-white dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700"
            }`}
            title="100% Full Realization & Delivery"
          >
            {clampedPercent === 100 ? "✓" : "₹"}
          </div>
        </div>

        {/* Milestone Tick Marks & Denominations */}
        <div className="grid grid-cols-5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 pt-1">
          <div className="text-left">
            <span className="block text-[9px] uppercase tracking-wider text-slate-400">0%</span>
            <span>Charter</span>
          </div>
          <div className="text-center">
            <span className="block text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">25%</span>
            <span>Diagnostic</span>
          </div>
          <div className="text-center">
            <span className="block text-[9px] uppercase tracking-wider text-teal-600 dark:text-teal-400">50%</span>
            <span>Core Cohort</span>
          </div>
          <div className="text-center">
            <span className="block text-[9px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">75%</span>
            <span>Advanced</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400">100%</span>
            <span>Sign-off 🏁</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE CONTROLS & QUICK MILESTONE BUTTONS */}
      {/* ========================================================= */}
      {showControls && editable && onPercentChange && (
        <div className="space-y-3 pt-2">
          {/* Range Slider for granular control */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              Drag Note Progress:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={clampedPercent}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
              title={`Drag to set progress (currently ${clampedPercent}%)`}
            />
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 w-12 text-right shrink-0">
              {clampedPercent}%
            </span>
          </div>

          {/* Quick Denomination Milestone Chips */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Quick Milestone Denominations:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[0, 20, 35, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSliderChange(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center space-x-1 shadow-2xs ${
                    clampedPercent === preset
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 ring-2 ring-emerald-500/20"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  <span>₹</span>
                  <span>{preset === 100 ? "100% 🏁" : `${preset}%`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verified Delivery Stamp when 100% is reached */}
      {clampedPercent === 100 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-2 border-amber-400/60 dark:border-amber-500/60 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-400 text-amber-950 rounded-xl font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-900 dark:text-amber-200">
                OFFICIAL SEAL: 100% DELIVERED & COMPLETED
              </div>
              <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                All delivery milestones satisfied and executive sign-off verified.
              </div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg font-black bg-amber-400 text-amber-950 shrink-0">
            PAID & SEALED
          </span>
        </div>
      )}
    </div>
  );
};
