"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import {
  AgingReceivablesSummary,
  DeliveryHealthSummary,
  OverdueItem,
} from "@/lib/deliveryAnalytics";
import { DeliveryRecord } from "@/types/delivery";

interface DeliveryRiskRadarProps {
  records: DeliveryRecord[];
  agingSummary: AgingReceivablesSummary;
  healthSummary: DeliveryHealthSummary;
  onSelectRecord: (recordId: string) => void;
  selectedMonthFilter: string;
}

export const DeliveryRiskRadar: React.FC<DeliveryRiskRadarProps> = ({
  records,
  agingSummary,
  healthSummary,
  onSelectRecord,
  selectedMonthFilter,
}) => {
  const [selectedBucket, setSelectedBucket] = useState<
    "all" | "under_30" | "days_30_60" | "days_60_plus"
  >("all");
  const [isAlertsExpanded, setIsAlertsExpanded] = useState<boolean>(true);

  const getFilteredItems = (): OverdueItem[] => {
    if (selectedBucket === "under_30") return agingSummary.under30Days.items;
    if (selectedBucket === "days_30_60") return agingSummary.days30to60.items;
    if (selectedBucket === "days_60_plus") return agingSummary.days60Plus.items;
    return [
      ...agingSummary.days60Plus.items,
      ...agingSummary.days30to60.items,
      ...agingSummary.under30Days.items,
    ];
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-4">
      {/* Top Cards: Aging Receivables Buckets & Overall Risk Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Bucket 1: Current / Under 30 Days */}
        <div
          onClick={() =>
            setSelectedBucket(selectedBucket === "under_30" ? "all" : "under_30")
          }
          className={`p-4 rounded-xl border transition cursor-pointer select-none ${
            selectedBucket === "under_30"
              ? "bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Current (0–30 Days)
            </span>
            <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
              {agingSummary.under30Days.count} items
            </span>
          </div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1.5">
            {formatINR(agingSummary.under30Days.amount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-emerald-500" />
            <span>Standard collection cycle</span>
          </div>
        </div>

        {/* Bucket 2: 30 - 60 Days Outstanding */}
        <div
          onClick={() =>
            setSelectedBucket(selectedBucket === "days_30_60" ? "all" : "days_30_60")
          }
          className={`p-4 rounded-xl border transition cursor-pointer select-none ${
            selectedBucket === "days_30_60"
              ? "bg-amber-50/80 dark:bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Watchlist (30–60 Days)
            </span>
            <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-black">
              {agingSummary.days30to60.count} items
            </span>
          </div>
          <div className="text-lg font-black text-amber-700 dark:text-amber-400 mt-1.5">
            {formatINR(agingSummary.days30to60.amount)}
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Follow-up reminder due</span>
          </div>
        </div>

        {/* Bucket 3: 60+ Days High Risk Escalation */}
        <div
          onClick={() =>
            setSelectedBucket(selectedBucket === "days_60_plus" ? "all" : "days_60_plus")
          }
          className={`p-4 rounded-xl border transition cursor-pointer select-none ${
            selectedBucket === "days_60_plus"
              ? "bg-rose-50/80 dark:bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              High Risk (60+ Days)
            </span>
            <span className="p-1 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[10px] font-black">
              {agingSummary.days60Plus.count} items
            </span>
          </div>
          <div className="text-lg font-black text-rose-700 dark:text-rose-400 mt-1.5">
            {formatINR(agingSummary.days60Plus.amount)}
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            <span>Executive escalation required</span>
          </div>
        </div>

        {/* Bucket 4: Project Operational Health Status */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Project Health Radar
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {healthSummary.totalProjects} active
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-2">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {healthSummary.onTrackCount}
              </span>
              <span className="text-[10px] text-slate-400">Track</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                {healthSummary.atRiskCount}
              </span>
              <span className="text-[10px] text-slate-400">Risk</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                {healthSummary.stalledCount}
              </span>
              <span className="text-[10px] text-slate-400">Stalled</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden flex">
            <div
              style={{
                width: `${
                  healthSummary.totalProjects > 0
                    ? (healthSummary.onTrackCount / healthSummary.totalProjects) * 100
                    : 100
                }%`,
              }}
              className="bg-emerald-500 h-full"
            />
            <div
              style={{
                width: `${
                  healthSummary.totalProjects > 0
                    ? (healthSummary.atRiskCount / healthSummary.totalProjects) * 100
                    : 0
                }%`,
              }}
              className="bg-amber-500 h-full"
            />
            <div
              style={{
                width: `${
                  healthSummary.totalProjects > 0
                    ? (healthSummary.stalledCount / healthSummary.totalProjects) * 100
                    : 0
                }%`,
              }}
              className="bg-rose-500 h-full"
            />
          </div>
        </div>
      </div>

      {/* Overdue Milestones & Payments Detail List */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Aging Receivables & Overdue Payment Inflow ({filteredItems.length})
            </h4>
            {selectedBucket !== "all" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Filtered: {selectedBucket.replace("_", " ").toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedBucket !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedBucket("all")}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Show All Buckets
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
            >
              {isAlertsExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {isAlertsExpanded && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-1.5">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  Clean Receivables Pipeline!
                </span>
                <span className="text-[11px] text-slate-400">
                  No payment terms or milestones are currently past due in this view.
                </span>
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <div
                  key={`${item.recordId}-${item.title}-${idx}`}
                  className="px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        item.agingBucket === "days_60_plus"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                          : item.agingBucket === "days_30_60"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-black text-slate-900 dark:text-white">
                          {item.companyName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {item.clientPartner}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                            item.agingBucket === "days_60_plus"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : item.agingBucket === "days_30_60"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {item.daysOverdue} days overdue
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>
                          {item.itemType === "milestone" ? "Milestone: " : "Tranche: "}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {item.title}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>Due: {item.dueDate}</span>
                        {item.invoiceNumber && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              Invoice: {item.invoiceNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="font-black text-slate-900 dark:text-white text-xs">
                        {formatINR(item.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">Pending Inflow</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectRecord(item.recordId)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>Open Project</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
