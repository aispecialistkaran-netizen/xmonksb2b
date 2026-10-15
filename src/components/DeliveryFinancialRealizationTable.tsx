"use client";

import React, { useMemo } from "react";
import { Download, ExternalLink } from "lucide-react";
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
  // Helper for computing single record financial values
  const getRecordFinancialBreakdown = (record: DeliveryRecord) => {
    const dealVal = record.dealValue || 0;
    let inv = 0;

    if (record.tenureType === "payment_terms") {
      (record.paymentTerms || []).forEach((t) => {
        if (t.paymentStatus === "received" || t.paymentStatus === "invoiced" || t.invoiceNumber) {
          inv += t.amount || 0;
        }
      });
    } else if (record.tenureType === "delivery") {
      (record.deliveryMilestones || []).forEach((m) => {
        if (m.paymentStatus === "received" || m.paymentStatus === "invoiced" || m.invoiceNumber) {
          inv += m.amount || 0;
        }
      });
    } else {
      (record.deliveryMilestones || []).forEach((m) => {
        if (m.paymentStatus === "received" || m.paymentStatus === "invoiced" || m.invoiceNumber) {
          inv += m.amount || 0;
        }
      });
      (record.paymentTerms || []).forEach((t) => {
        if (t.paymentStatus === "received" || t.paymentStatus === "invoiced" || t.invoiceNumber) {
          inv += t.amount || 0;
        }
      });
    }

    return {
      dealVal,
      inv,
    };
  };

  // Portfolio Scope Totals
  const totals = useMemo(() => {
    let totalDealValue = 0;
    let totalInvoiced = 0;

    records.forEach((r) => {
      const b = getRecordFinancialBreakdown(r);
      totalDealValue += b.dealVal;
      totalInvoiced += b.inv;
    });

    return {
      totalDealValue,
      totalInvoiced,
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
    ];

    const rows = records.map((record) => {
      const b = getRecordFinancialBreakdown(record);

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
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const dateStr = new Date().toISOString().split("T")[0];
    downloadCSV(`xmonks-delivery-financial-table-${dateStr}.csv`, csvContent);
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
          No active delivery contracts match your selected filters. Adjust your owner, month, or tenure filters to view data.
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

        {showExportButton && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer self-end sm:self-auto"
            title="Export Table as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        )}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((record) => {
              const b = getRecordFinancialBreakdown(record);
              const isSelected = activeRecordId === record.id;

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelectRecord?.(record.id)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none ${
                    isSelected ? "bg-indigo-50/70 dark:bg-indigo-950/40" : ""
                  }`}
                  title={onSelectRecord ? "Click to view and manage delivery project" : undefined}
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
                            <span className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition inline-block">
                              <ExternalLink className="w-3 h-3" />
                            </span>
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
                </tr>
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
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
