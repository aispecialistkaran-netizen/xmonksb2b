"use client";

import React from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Users,
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { DeliveryRecord } from "@/types/delivery";

interface DeliveryTimelineViewProps {
  records: DeliveryRecord[];
  onSelectRecord: (recordId: string) => void;
}

export const DeliveryTimelineView: React.FC<DeliveryTimelineViewProps> = ({
  records,
  onSelectRecord,
}) => {
  // 12 Months of the calendar year
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Helper to determine the start and end month indices (0-11) for a record
  const getTimelineIndices = (r: DeliveryRecord) => {
    let startIdx = 0;
    let endIdx = 5;

    // Helper to safely extract a month index (0-11) from any date or ISO string
    const getMonthIndex = (val?: string | null): number | null => {
      if (!val) return null;
      const clean = val.trim().split("T")[0];
      const match = clean.match(/^(\d{4})-(\d{1,2})/);
      if (match) {
        const monthNum = parseInt(match[2], 10);
        if (monthNum >= 1 && monthNum <= 12) {
          return monthNum - 1;
        }
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.getMonth();
      return null;
    };

    // 1. Resolve start month index (prefer closureMonth if available as the win/start date, otherwise startDate, createdAt)
    const closureIdx = getMonthIndex(r.closureMonth);
    const startIdxDirect = getMonthIndex(r.startDate);

    if (closureIdx !== null && startIdxDirect !== null) {
      startIdx = closureIdx;
    } else if (closureIdx !== null) {
      startIdx = closureIdx;
    } else if (startIdxDirect !== null) {
      startIdx = startIdxDirect;
    } else if (r.createdAt) {
      const createdIdx = getMonthIndex(r.createdAt);
      if (createdIdx !== null) startIdx = createdIdx;
    }

    // 2. Resolve target completion month index
    const targetIdxDirect = getMonthIndex(r.targetCompletionDate);

    if (targetIdxDirect !== null && targetIdxDirect >= startIdx) {
      endIdx = targetIdxDirect;
    } else {
      // Check latest date among milestones and payment terms
      let latestTrancheMonth: number | null = null;
      (r.deliveryMilestones || []).forEach((m) => {
        const mIdx = getMonthIndex(m.completionDate || m.targetDate || m.paymentReceivedDate);
        if (mIdx !== null && (latestTrancheMonth === null || mIdx > latestTrancheMonth)) {
          latestTrancheMonth = mIdx;
        }
      });
      (r.paymentTerms || []).forEach((t) => {
        const tIdx = getMonthIndex(t.paymentReceivedDate || t.dueDate);
        if (tIdx !== null && (latestTrancheMonth === null || tIdx > latestTrancheMonth)) {
          latestTrancheMonth = tIdx;
        }
      });

      if (latestTrancheMonth !== null && latestTrancheMonth >= startIdx) {
        endIdx = latestTrancheMonth;
      } else {
        // Standard multi-month engagement span
        endIdx = Math.min(11, startIdx + (r.overallCompletionPercent === 100 ? 3 : 2));
      }
    }

    if (endIdx < startIdx) {
      endIdx = Math.min(11, startIdx + 2);
    }

    return { startIdx, endIdx };
  };

  return (
    <div className="space-y-4">
      {/* Timeline Controls & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400 font-bold">On Track</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400 font-bold">At Risk</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400 font-bold">Stalled</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-400 font-bold">Completed Tranche</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-semibold">
          Displaying {records.length} project roadmaps across 2026
        </span>
      </div>

      {/* Gantt Matrix Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-sm">
        <div className="min-w-[900px]">
          {/* Months Header Grid */}
          <div className="grid grid-cols-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center py-2.5 text-xs font-black text-slate-600 dark:text-slate-300">
            {months.map((m, idx) => (
              <div
                key={m}
                className={`py-1 border-r last:border-r-0 border-slate-200 dark:border-slate-800 ${
                  idx === new Date().getMonth()
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-sm"
                    : ""
                }`}
              >
                <span>{m}</span>
                {idx === new Date().getMonth() && (
                  <span className="block text-[9px] font-bold uppercase text-indigo-500 tracking-tighter">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Project Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No delivery projects matching current filters.
              </div>
            ) : (
              records.map((r) => {
                const { startIdx, endIdx } = getTimelineIndices(r);
                const spanMonths = endIdx - startIdx + 1;
                const leftPercent = (startIdx / 12) * 100;
                const widthPercent = Math.max(8, (spanMonths / 12) * 100);

                const health = r.projectHealth || "on_track";
                const healthColor =
                  health === "stalled"
                    ? "bg-rose-500"
                    : health === "at_risk"
                    ? "bg-amber-500"
                    : "bg-emerald-500";

                return (
                  <div
                    key={r.id}
                    onClick={() => onSelectRecord(r.id)}
                    className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition p-3 cursor-pointer select-none space-y-2"
                  >
                    {/* Top Row: Company, Program, Deal Value, Client Partner */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${healthColor}`} />
                        <span className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {r.companyName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {r.program || "Leadership Journey"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {r.clientPartner}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatINR(r.dealValue || 0)}
                        </span>
                        <span>{r.overallCompletionPercent || 0}% Complete</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>

                    {/* Timeline Gantt Track */}
                    <div className="relative w-full h-8 bg-slate-100/70 dark:bg-slate-800/50 rounded-lg overflow-hidden flex items-center">
                      {/* Grid guideline separators */}
                      <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                        {months.map((_, i) => (
                          <div
                            key={i}
                            className="border-r border-slate-200/50 dark:border-slate-700/30 h-full last:border-r-0"
                          />
                        ))}
                      </div>

                      {/* Project Active Gantt Bar */}
                      <div
                        style={{
                          marginLeft: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        className={`relative z-10 h-6 rounded-md shadow-xs transition-all flex items-center justify-between px-2 text-[10px] font-bold text-white ${
                          health === "stalled"
                            ? "bg-gradient-to-r from-rose-600 to-rose-500"
                            : health === "at_risk"
                            ? "bg-gradient-to-r from-amber-600 to-amber-500"
                            : "bg-gradient-to-r from-indigo-600 to-blue-500"
                        }`}
                      >
                        <span className="truncate pr-1">
                          {months[startIdx]} – {months[endIdx]}
                        </span>
                        <span className="bg-black/20 px-1 rounded text-[9px] shrink-0">
                          {r.overallCompletionPercent || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
