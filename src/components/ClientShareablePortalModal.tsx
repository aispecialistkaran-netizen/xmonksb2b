"use client";

import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Eye,
  Lock,
  Building2,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { DeliveryRecord } from "@/types/delivery";

interface ClientShareablePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DeliveryRecord;
}

export const ClientShareablePortalModal: React.FC<ClientShareablePortalModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate shareable URL token
  const shareToken = record.shareToken || `xm-portal-${record.id}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const shareableUrl = `${origin}/portal/${shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const completedMilestones = (record.deliveryMilestones || []).filter(
    (m) => m.milestoneStatus === "completed"
  ).length;
  const totalMilestones = (record.deliveryMilestones || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Client-Facing Shareable Live Dashboard
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tokenized read-only link for client sponsors (financial margins and deal values hidden).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Link Copy Bar */}
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 shrink-0">
              Shareable Link:
            </span>
            <code className="px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
              {shareableUrl}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Client Link</span>
              </>
            )}
          </button>
        </div>

        {/* Live Client Preview Window */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Eye className="w-3 h-3 text-indigo-500" />
              <span>Live Client Dashboard Preview (What Client Sponsors See)</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center space-x-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Financial Margins Scrubbed</span>
            </span>
          </div>

          {/* Client Dashboard Container */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-6">
            {/* Header: Company & Program */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                  xMonks Enterprise Journey
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {record.companyName}
                </h2>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  {record.program || "Executive Leadership Transformation & Coaching"}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {record.overallCompletionPercent || 0}%
                  </div>
                  <div className="text-[10px] text-slate-400">Journey Progress</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-xs">
                  {record.overallCompletionPercent || 0}%
                </div>
              </div>
            </div>

            {/* Quick Metrics (Non-Financial) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Delivery Status
                </span>
                <span className="font-black text-slate-900 dark:text-white uppercase mt-0.5 block">
                  {record.deliveryStatus.replace("_", " ")}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Milestones Completed
                </span>
                <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                  {completedMilestones} of {totalMilestones} Phases Delivered
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Executive Coaching Hours
                </span>
                <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                  {record.coachingSessionsCompleted || 0} of {record.coachingSessionsTotal || 12} Delivered
                </span>
              </div>
            </div>

            {/* Milestones Curriculum Roadmap */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-500" />
                <span>Curriculum Milestones & Phases</span>
              </h4>

              <div className="space-y-2">
                {(record.deliveryMilestones || []).map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          m.milestoneStatus === "completed"
                            ? "bg-emerald-500 text-white"
                            : m.milestoneStatus === "in_progress"
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        }`}
                      >
                        {m.milestoneStatus === "completed" ? "✓" : idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {m.milestoneTitle}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Target Completion: {m.targetDate || "Ongoing"}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        m.milestoneStatus === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : m.milestoneStatus === "in_progress"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {m.milestoneStatus.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Faculty Section */}
            {(record.coaches || []).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Assigned Coaching Faculty
                </span>
                <div className="flex flex-wrap gap-2">
                  {record.coaches!.map((c) => (
                    <div
                      key={c.id}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-xs"
                    >
                      {c.name} • {c.role.replace("_", " ").toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
