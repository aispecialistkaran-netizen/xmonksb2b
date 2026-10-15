"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  Download,
  CheckCircle2,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  Star,
} from "lucide-react";
import { DeliveryRecord } from "@/types/delivery";
import { formatINR } from "@/lib/formatters";
import { downloadCSV } from "@/lib/deliveryAnalytics";

interface DeliveryFinancialRealizationTableProps {
  records: DeliveryRecord[];
  onSelectRecord?: (recordId: string) => void;
  title?: string;
  showExportButton?: boolean;
  activeRecordId?: string | null;
}

export const DeliveryFinancialRealizationTable: React.FC<
  DeliveryFinancialRealizationTableProps
> = ({
  records,
  onSelectRecord,
  title = "DELIVERY ACCOUNTS & FINANCIAL REALIZATION TABLE",
  showExportButton = true,
  activeRecordId,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return activeRecordId ? new Set([activeRecordId]) : new Set();
  });

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(records.map((r) => r.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Helper for computing single record financial values
  const getRecordFinancialBreakdown = (record: DeliveryRecord) => {
    const dealVal = record.dealValue || 0;
    let rec = 0;
    let inv = 0;

    if (record.tenureType === "payment_terms") {
      (record.paymentTerms || []).forEach((t) => {
        if (t.paymentStatus === "received") {
          rec += t.amount || 0;
          inv += t.amount || 0;
        } else if (t.paymentStatus === "invoiced" || t.invoiceNumber) {
          inv += t.amount || 0;
        }
      });
    } else if (record.tenureType === "delivery") {
      (record.deliveryMilestones || []).forEach((m) => {
        if (m.paymentStatus === "received") {
          rec += m.amount || 0;
          inv += m.amount || 0;
        } else if (m.paymentStatus === "invoiced" || m.invoiceNumber) {
          inv += m.amount || 0;
        }
      });
    } else {
      (record.deliveryMilestones || []).forEach((m) => {
        if (m.paymentStatus === "received") {
          rec += m.amount || 0;
          inv += m.amount || 0;
        } else if (m.paymentStatus === "invoiced" || m.invoiceNumber) {
          inv += m.amount || 0;
        }
      });
      (record.paymentTerms || []).forEach((t) => {
        if (t.paymentStatus === "received") {
          rec += t.amount || 0;
          inv += t.amount || 0;
        } else if (t.paymentStatus === "invoiced" || t.invoiceNumber) {
          inv += t.amount || 0;
        }
      });
    }

    const pend = Math.max(0, dealVal - rec);

    // Find next pending or invoiced tranche
    const nextItem =
      record.tenureType === "payment_terms"
        ? (record.paymentTerms || []).find(
            (t) => t.paymentStatus === "invoiced" || t.paymentStatus === "pending"
          )
        : (record.deliveryMilestones || []).find(
            (m) =>
              m.paymentStatus === "invoiced" ||
              m.milestoneStatus === "in_progress" ||
              m.paymentStatus === "pending"
          );

    return {
      dealVal,
      rec,
      inv,
      pend,
      nextItem,
    };
  };

  // Portfolio Scope Totals
  const totals = useMemo(() => {
    let totalDealValue = 0;
    let totalInvoiced = 0;
    let totalReceived = 0;

    records.forEach((r) => {
      const b = getRecordFinancialBreakdown(r);
      totalDealValue += b.dealVal;
      totalInvoiced += b.inv;
      totalReceived += b.rec;
    });

    const totalPending = Math.max(0, totalDealValue - totalReceived);
    const realizedRate =
      totalDealValue > 0 ? Math.round((totalReceived / totalDealValue) * 100) : 0;

    return {
      totalDealValue,
      totalInvoiced,
      totalReceived,
      totalPending,
      realizedRate,
    };
  }, [records]);

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = [
      "Company Name",
      "Program",
      "Lead Owner / Partner",
      "Delivery Lead",
      "Start Date",
      "Target Date",
      "Delivery Status",
      "Completion (%)",
      "Delivery Book (INR)",
      "Invoiced Book (INR)",
      "Cash Collected (INR)",
      "Pending Balance (INR)",
      "Realization Rate (%)",
      "Next Action / Tranche",
    ];

    const rows = records.map((record) => {
      const b = getRecordFinancialBreakdown(record);
      const nextLabel = b.nextItem
        ? `${(b.nextItem as any).termLabel || (b.nextItem as any).milestoneTitle || "Next Tranche"} (${formatINR(b.nextItem.amount)})`
        : "100% Realized";

      return [
        `"${record.companyName.replace(/"/g, '""')}"`,
        `"${(record.program || "Executive Coaching").replace(/"/g, '""')}"`,
        `"${(record.clientPartner || "Sales Lead").replace(/"/g, '""')}"`,
        `"${(record.deliveryLead || "Delivery Lead").replace(/"/g, '""')}"`,
        `"${record.startDate || ""}"`,
        `"${record.targetCompletionDate || ""}"`,
        `"${record.deliveryStatus}"`,
        record.overallCompletionPercent || 0,
        b.dealVal,
        b.inv,
        b.rec,
        b.pend,
        b.dealVal > 0 ? Math.round((b.rec / b.dealVal) * 100) : 0,
        `"${nextLabel.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const dateStr = new Date().toISOString().split("T")[0];
    downloadCSV(`xmonks-financial-realization-report-${dateStr}.csv`, csvContent);
  };

  if (records.length === 0) {
    return (
      <div className="py-12 text-center p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl">
          📋
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No Delivery Accounts in Selection
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No active delivery contracts match your selected filters. Adjust your owner, month, or tenure filters to view realization data.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-base">📋</span>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {title}
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {records.length} Accounts
          </span>
        </div>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Click any row to expand milestone tranches
          </span>

          <div className="flex items-center space-x-1.5 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-2 py-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-2 py-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Collapse
            </button>
          </div>

          {showExportButton && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer ml-1"
              title="Export Realization Report as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Client Account & Program</th>
              <th className="py-3 px-3">Project Tenure</th>
              <th className="py-3 px-3">Status & Progress</th>
              <th className="py-3 px-3 text-right">Delivery Book</th>
              <th className="py-3 px-3 text-right text-cyan-700 dark:text-cyan-400">
                Invoiced Book
              </th>
              <th className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400">
                Cash Collected
              </th>
              <th className="py-3 px-3 text-right text-rose-700 dark:text-rose-400">
                Pending Balance
              </th>
              <th className="py-3 px-3">Next Tranche / Action</th>
              <th className="py-3 px-3 text-center">Tranches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((record) => {
              const b = getRecordFinancialBreakdown(record);
              const isExpanded = expandedIds.has(record.id);

              return (
                <React.Fragment key={record.id}>
                  <tr
                    onClick={() => toggleExpand(record.id)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none ${
                      isExpanded ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    {/* Account & Program */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {record.companyName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-slate-900 dark:text-white text-xs truncate">
                              {record.companyName}
                            </span>
                            {onSelectRecord && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRecord(record.id);
                                }}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition cursor-pointer"
                                title="Open full project delivery manager"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {record.program || "Executive Coaching"} • Lead:{" "}
                            {record.deliveryLead || record.clientPartner || "Delivery Lead"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Project Tenure */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {record.startDate || "2026-10-01"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        to {record.targetCompletionDate || "2026-12-31"}
                      </div>
                    </td>

                    {/* Status & Progress */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            record.deliveryStatus === "delivered"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                          }`}
                        >
                          {record.deliveryStatus === "delivered" ? "Delivered" : "In Progress"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {record.overallCompletionPercent || 0}%
                        </span>
                      </div>
                      <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, record.overallCompletionPercent || 0)}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Delivery Book */}
                    <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white text-xs whitespace-nowrap">
                      {formatINR(b.dealVal)}
                    </td>

                    {/* Invoiced Book */}
                    <td className="py-3.5 px-3 text-right font-bold text-cyan-700 dark:text-cyan-400 text-xs whitespace-nowrap">
                      {formatINR(b.inv)}
                    </td>

                    {/* Cash Collected */}
                    <td className="py-3.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                      {formatINR(b.rec)}
                      <span className="block text-[9px] text-slate-400 font-semibold">
                        {b.dealVal > 0 ? `${Math.round((b.rec / b.dealVal) * 100)}%` : "0%"}
                      </span>
                    </td>

                    {/* Pending Balance */}
                    <td className="py-3.5 px-3 text-right font-black text-rose-600 dark:text-rose-400 text-xs whitespace-nowrap">
                      {formatINR(b.pend)}
                    </td>

                    {/* Next Tranche / Action */}
                    <td className="py-3.5 px-3 text-xs max-w-[200px]">
                      {b.nextItem ? (
                        <div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase inline-block ${
                              b.nextItem.paymentStatus === "invoiced"
                                ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {b.nextItem.paymentStatus === "invoiced" ? "Invoiced" : "Pending"}
                          </span>
                          <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {formatINR(b.nextItem.amount)} •{" "}
                            {(b.nextItem as any).termLabel ||
                              (b.nextItem as any).milestoneTitle ||
                              "Next Tranche"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          ✓ 100% Realized
                        </span>
                      )}
                    </td>

                    {/* Chevron */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(record.id, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        title={isExpanded ? "Collapse tranches" : "View milestone tranches"}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-amber-600" : ""
                          }`}
                        />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Sub-Row: Milestone Tranches */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90 dark:bg-slate-900/70 border-b border-amber-200 dark:border-amber-900/50">
                      <td colSpan={9} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Milestone & Payment Tranches for {record.companyName}:
                            </span>
                            <div className="flex items-center space-x-3">
                              {record.clientSignoff && (
                                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <span>⭐⭐⭐⭐⭐</span>
                                  <span>
                                    CSAT {record.clientSignoff.csatRating}/5 (
                                    {record.clientSignoff.signatoryName})
                                  </span>
                                </span>
                              )}
                              {onSelectRecord && (
                                <button
                                  type="button"
                                  onClick={() => onSelectRecord(record.id)}
                                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                                >
                                  <span>Manage Milestones in Project Tab</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {(() => {
                              const tranches =
                                record.tenureType === "payment_terms"
                                  ? (record.paymentTerms || []).map((t, idx) => ({
                                      id: t.id || idx,
                                      title: t.termLabel || `Tranche ${idx + 1}`,
                                      amount: t.amount || 0,
                                      percent: t.paymentPercent || 0,
                                      paymentStatus: t.paymentStatus,
                                      invoiceNumber: t.invoiceNumber,
                                      dateLabel: t.paymentReceivedDate
                                        ? `Received ${t.paymentReceivedDate}`
                                        : t.dueDate
                                        ? `Due ${t.dueDate}`
                                        : "",
                                    }))
                                  : (record.deliveryMilestones || []).map((m, idx) => ({
                                      id: m.id || idx,
                                      title: m.milestoneTitle || `Milestone ${idx + 1}`,
                                      amount: m.amount || 0,
                                      percent: m.paymentPercent || 0,
                                      paymentStatus: m.paymentStatus,
                                      invoiceNumber: m.invoiceNumber,
                                      dateLabel: m.paymentReceivedDate
                                        ? `Received ${m.paymentReceivedDate}`
                                        : m.targetDate
                                        ? `Due ${m.targetDate}`
                                        : "",
                                    }));

                              if (tranches.length === 0) {
                                return (
                                  <div className="col-span-full py-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    No milestone or payment tranches scheduled yet. Click Manage to add tranches.
                                  </div>
                                );
                              }

                              return tranches.map((m, idx) => (
                                <div
                                  key={m.id || idx}
                                  className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                                    m.paymentStatus === "received"
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                                      : m.paymentStatus === "invoiced"
                                      ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800"
                                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="truncate text-slate-800 dark:text-slate-200">
                                      {m.title}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                        m.paymentStatus === "received"
                                          ? "bg-emerald-500 text-white"
                                          : m.paymentStatus === "invoiced"
                                          ? "bg-cyan-500 text-white"
                                          : "bg-amber-500 text-white"
                                      }`}
                                    >
                                      {m.paymentStatus === "received"
                                        ? "Realized"
                                        : m.paymentStatus === "invoiced"
                                        ? "Invoiced"
                                        : "Pending"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] pt-1">
                                    <span className="font-black text-slate-900 dark:text-white">
                                      {formatINR(m.amount)} ({m.percent}%)
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                      {m.dateLabel ||
                                        (m.invoiceNumber ? `Inv: ${m.invoiceNumber}` : "")}
                                    </span>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/90 dark:bg-slate-900/90 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700">
              <td
                className="py-3.5 px-4 uppercase text-slate-600 dark:text-slate-300"
                colSpan={3}
              >
                Total Portfolio Scope ({records.length} Accounts)
              </td>
              <td className="py-3.5 px-3 text-right text-slate-900 dark:text-white">
                {formatINR(totals.totalDealValue)}
              </td>
              <td className="py-3.5 px-3 text-right text-cyan-700 dark:text-cyan-400">
                {formatINR(totals.totalInvoiced)}
              </td>
              <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                {formatINR(totals.totalReceived)}
              </td>
              <td className="py-3.5 px-3 text-right text-rose-600 dark:text-rose-400">
                {formatINR(totals.totalPending)}
              </td>
              <td
                className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] font-semibold"
                colSpan={2}
              >
                {totals.realizedRate}% Realized
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
