"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  Building2,
  CreditCard,
  FileCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { DeliveryRecord, DeliveryMilestoneTranche, PaymentTermTranche } from "@/types/delivery";

interface DeliveryInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DeliveryRecord;
  item: DeliveryMilestoneTranche | PaymentTermTranche | null;
  itemType: "milestone" | "payment_term";
  onSaveUTR: (
    itemId: string,
    itemType: "milestone" | "payment_term",
    invoiceNumber: string,
    utrNumber: string,
    bankReference: string,
    paymentDate: string
  ) => void;
}

export const DeliveryInvoiceModal: React.FC<DeliveryInvoiceModalProps> = ({
  isOpen,
  onClose,
  record,
  item,
  itemType,
  onSaveUTR,
}) => {
  if (!isOpen || !item) return null;

  const baseAmount = item.amount || 0;
  const defaultInvoiceNo =
    item.invoiceNumber || `INV-XM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNo);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [gstType, setGstType] = useState<"cgst_sgst" | "igst">("cgst_sgst");
  const [clientGst, setClientGst] = useState(item.gstNumber || record.gstNumber || "07AAACX1234F1Z8");
  const [clientAddress, setClientAddress] = useState(
    record.clientBillingAddress || `${record.city || "Corporate Towers"}, India`
  );

  // UTR & Payment Proof Tracking Form
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [utrNumber, setUtrNumber] = useState(item.utrNumber || "");
  const [bankRef, setBankRef] = useState(item.bankReference || "HDFC Bank Corporate Transfer");
  const [paymentDate, setPaymentDate] = useState(
    item.paymentReceivedDate || new Date().toISOString().split("T")[0]
  );

  const gstRate = 0.18;
  const gstAmount = Math.round(baseAmount * gstRate);
  const totalAmount = baseAmount + gstAmount;

  const itemTitle =
    itemType === "milestone"
      ? (item as DeliveryMilestoneTranche).milestoneTitle
      : (item as PaymentTermTranche).termLabel;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaymentReceived = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) return;
    onSaveUTR(item.id, itemType, invoiceNumber, utrNumber.trim(), bankRef, paymentDate);
    setIsRecordingPayment(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden print:m-0 print:border-none print:shadow-none">
        {/* Modal Controls Header (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Tax Invoice & Payment Proof Management
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Generate official billing invoice or record UTR bank confirmation slip.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 print:p-0 space-y-6 text-slate-800 dark:text-slate-200">
          {/* Brand Header */}
          <div className="flex justify-between items-start border-b pb-6 border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                  xMonks
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-300">
                  Leadership Services
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                <p>xMonks Consulting & Leadership Ecosystem Pvt Ltd</p>
                <p>Plot 48, Sector 44, Institutional Area, Gurugram, HR - 122003</p>
                <p>GSTIN: 07AABCX9988D1Z4 | CIN: U74140DL2018PTC334512</p>
                <p>finance@xmonks.com | +91 124 456 7890</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                TAX INVOICE
              </span>
              <div className="mt-3 text-xs space-y-1">
                <div>
                  <span className="text-slate-400">Invoice No: </span>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="font-black text-slate-900 dark:text-white border-b border-dotted border-slate-300 dark:border-slate-700 bg-transparent text-right outline-none w-36 print:border-none"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Date: </span>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="font-bold text-slate-800 dark:text-slate-200 bg-transparent text-right outline-none print:border-none"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Payment Status: </span>
                  <strong className="text-emerald-600 dark:text-emerald-400 uppercase">
                    {item.paymentStatus}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To & Program Details */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Billed To (Client Partner)
              </span>
              <div className="font-black text-sm text-slate-900 dark:text-white">
                {record.companyName}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Attn: {record.contactName} ({record.designation || "Executive Sponsor"})
              </p>
              <div className="flex items-center space-x-1 pt-1">
                <span className="text-slate-400">Client GSTIN:</span>
                <input
                  type="text"
                  value={clientGst}
                  onChange={(e) => setClientGst(e.target.value)}
                  className="font-bold border-b border-dotted border-slate-300 bg-transparent outline-none w-36 print:border-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="text-slate-500 bg-transparent outline-none w-full border-b border-dotted border-slate-300 print:border-none"
                  placeholder="Billing address..."
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Engagement Reference
              </span>
              <div className="font-black text-slate-900 dark:text-white">
                {record.program || "Enterprise Leadership Journey"}
              </div>
              <p className="text-slate-500">
                Managing Partner: {record.clientPartner}
              </p>
              <p className="text-slate-500">
                Delivery Lead: {record.deliveryLead || "Operations Directorate"}
              </p>
              <div className="pt-1 text-[11px] text-slate-400">
                Tenure Model:{" "}
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {record.tenureType}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-4 text-center">Milestone %</th>
                  <th className="py-2.5 px-4 text-right">Taxable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-black text-slate-900 dark:text-white">
                      {itemTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.notes || `Deliverable tranche linked to ${record.program}.`}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                    {item.paymentPercent}%
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                    {formatINR(baseAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations Breakdown */}
          <div className="flex justify-end text-xs">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal (Taxable):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatINR(baseAmount)}
                </span>
              </div>

              {gstType === "cgst_sgst" ? (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST (9%):</span>
                    <span>{formatINR(Math.round(gstAmount / 2))}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST (9%):</span>
                    <span>{formatINR(Math.round(gstAmount / 2))}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-500">
                  <span>IGST (18%):</span>
                  <span>{formatINR(gstAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                <span>Total Invoice Due:</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {formatINR(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Banking / Remittance Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
            <div className="font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              <span>Bank Remittance & NEFT / RTGS Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
              <div>
                <p>Beneficiary: xMonks Ecosystem Pvt Ltd</p>
                <p>Bank: HDFC Bank Ltd</p>
                <p>A/C Number: 50200049283719</p>
              </div>
              <div>
                <p>Account Type: Current Account</p>
                <p>IFSC Code: HDFC0001042</p>
                <p>Branch: Sector 44 Institutional Area, Gurugram</p>
              </div>
            </div>
          </div>

          {/* Record UTR / Payment Proof Form (Hidden on Print) */}
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-black text-slate-900 dark:text-white text-xs">
                  Record Received Payment & UTR Reference
                </h4>
              </div>
              {item.utrNumber && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                  ✓ Recorded UTR: {item.utrNumber}
                </span>
              )}
            </div>

            <form onSubmit={handleMarkPaymentReceived} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    UTR / Wire Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. HDFCN26098234891"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Bank / Method Description
                  </label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="e.g. ICICI Corporate NEFT"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Received with UTR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
