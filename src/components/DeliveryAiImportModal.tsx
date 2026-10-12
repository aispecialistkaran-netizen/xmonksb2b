"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  Upload,
  FileText,
  FileCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  Calendar,
  Truck,
  Receipt,
  Users,
  Percent,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Info,
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import {
  DeliveryRecord,
  TenureType,
  DeliveryMilestoneTranche,
  PaymentTermTranche,
  CoachAssignment,
} from "@/types/delivery";

export interface ExtractedDeliveryData {
  clientName: string;
  programName: string;
  dealValue: number;
  tenureType: TenureType;
  tenureTypeExplanation: string;
  deliveryMilestones: DeliveryMilestoneTranche[];
  paymentTerms: PaymentTermTranche[];
  coachingSessionsTotal: number;
  coaches: CoachAssignment[];
  commercialNotes?: string;
}

interface DeliveryAiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DeliveryRecord;
  onApplySchedule: (extracted: ExtractedDeliveryData) => Promise<void>;
}

export const DeliveryAiImportModal: React.FC<DeliveryAiImportModalProps> = ({
  isOpen,
  onClose,
  record,
  onApplySchedule,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useSampleFile, setUseSampleFile] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [extractedData, setExtractedData] = useState<ExtractedDeliveryData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [dealValueOverride, setDealValueOverride] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUseSampleFile(false);
      setErrorMsg(null);
      setExtractedData(null);
    }
  };

  const handleSelectSample = () => {
    setSelectedFile(null);
    setUseSampleFile(true);
    setErrorMsg(null);
    setExtractedData(null);
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile && !useSampleFile) {
      setErrorMsg("Please select a PDF or DOCX file, or click 'Try Reference Sample'.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMsg(null);
      setAnalysisStep("Reading proposal document & extracting commercial clauses...");

      let res: Response;

      if (useSampleFile) {
        setAnalysisStep("Analyzing ICICI Lombard proposal with Gemini AI...");
        res = await fetch("/api/delivery/parse-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ useSample: true }),
        });
      } else if (selectedFile) {
        setAnalysisStep(`Parsing ${selectedFile.name} with Gemini AI...`);
        const formData = new FormData();
        formData.append("file", selectedFile);
        res = await fetch("/api/delivery/parse-proposal", {
          method: "POST",
          body: formData,
        });
      } else {
        throw new Error("No file selected.");
      }

      setAnalysisStep("Structuring milestones, advance tranches & tenure classification...");

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to parse proposal document via AI.");
      }

      const parsed = json.data as ExtractedDeliveryData;
      setExtractedData(parsed);
      setDealValueOverride(parsed.dealValue || record.dealValue || 0);
    } catch (err: unknown) {
      console.error("AI Analysis error:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Error analyzing proposal document."
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleConfirmApply = async () => {
    if (!extractedData) return;

    try {
      setIsApplying(true);
      const finalData: ExtractedDeliveryData = {
        ...extractedData,
        dealValue: dealValueOverride > 0 ? dealValueOverride : extractedData.dealValue,
      };

      // Recalculate amounts if dealValue was adjusted
      if (dealValueOverride > 0 && dealValueOverride !== extractedData.dealValue) {
        finalData.deliveryMilestones = finalData.deliveryMilestones.map((m) => ({
          ...m,
          amount: Math.round(dealValueOverride * ((m.paymentPercent || 0) / 100)),
        }));
        finalData.paymentTerms = finalData.paymentTerms.map((t) => ({
          ...t,
          amount: Math.round(dealValueOverride * ((t.paymentPercent || 0) / 100)),
        }));
      }

      await onApplySchedule(finalData);
      onClose();
    } catch (err) {
      console.error("Apply error:", err);
      setErrorMsg("Failed to overwrite schedule. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-8 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Add Tenure Schedule via Gemini AI
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
                  Document Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload any client Financial Proposal or Contract (.pdf or .docx) for{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {record.companyName}
                </strong>
                . Gemini will automatically classify and construct the entire schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning: Notice of Replacement */}
        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-2xl flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-amber-900 dark:text-amber-200">
            <strong>Schedule Replacement Notice:</strong> Applying this AI extraction will{" "}
            <span className="underline decoration-amber-500 font-bold">
              delete the current milestones and payment terms
            </span>{" "}
            in Delivery & Tenure Schedule for this project, and replace them with the structured
            terms read directly from the document.
          </div>
        </div>

        {/* Upload & Source Selection View (When Not Extracted) */}
        {!extractedData && (
          <div className="space-y-4">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3 cursor-pointer transition text-center ${
                selectedFile
                  ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30"
                  : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {selectedFile ? (
                    <span className="text-indigo-600 dark:text-indigo-400">
                      📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    "Click to browse or drop client Financial Proposal / Contract"
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports Adobe PDF (.pdf) and Microsoft Word (.docx) documents
                </p>
              </div>
            </div>

            {/* Quick Sample Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Or test with verified reference sample:</span>
              </div>
              <button
                type="button"
                onClick={handleSelectSample}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  useSampleFile
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ICICI Lombard Financial Proposal 2.0 (PDF)</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center space-x-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Analysis In Progress Indicator */}
            {isAnalyzing && (
              <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-center space-y-3">
                <RefreshCw className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                <div>
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                    Gemini AI Commercial Extraction
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    {analysisStep}
                  </p>
                </div>
              </div>
            )}

            {/* Run Button */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={(!selectedFile && !useSampleFile) || isAnalyzing}
                onClick={handleRunAnalysis}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-md cursor-pointer ${
                  (!selectedFile && !useSampleFile) || isAnalyzing
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? "Reading Document..." : "Read & Analyze with Gemini"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Extracted Preview View */}
        {extractedData && (
          <div className="space-y-5 animate-fadeIn">
            {/* Detected Tenure Model Badge & Rationale */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-emerald-950/40 rounded-2xl border-2 border-indigo-400/40 dark:border-indigo-600/40 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  AI Classified Tenure Model
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border flex items-center space-x-1.5 ${
                    extractedData.tenureType === "contract"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                      : extractedData.tenureType === "delivery"
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                      : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                  }`}
                >
                  {extractedData.tenureType === "contract" && <FileText className="w-3.5 h-3.5" />}
                  {extractedData.tenureType === "delivery" && <Truck className="w-3.5 h-3.5" />}
                  {extractedData.tenureType === "payment_terms" && <Calendar className="w-3.5 h-3.5" />}
                  <span className="capitalize">
                    {extractedData.tenureType === "contract"
                      ? "Master Contract (Hybrid Delivery + Payment Terms)"
                      : extractedData.tenureType === "delivery"
                      ? "Delivery Model (% Milestone Completion)"
                      : "Payment Terms Model (Scheduled Tranches)"}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{extractedData.tenureTypeExplanation}"
              </p>
            </div>

            {/* Commercial Summary Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Identified Client
                </span>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">
                  {extractedData.clientName || record.companyName}
                </div>
                <span className="text-[10px] text-slate-400 truncate block">
                  {extractedData.programName || record.program}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Deal Value (INR)
                </span>
                <div className="flex items-center space-x-1 mt-0.5">
                  <input
                    type="number"
                    value={dealValueOverride}
                    onChange={(e) => setDealValueOverride(Number(e.target.value))}
                    className="w-full text-sm font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Formatted: {formatINR(dealValueOverride)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Coaching Sessions
                </span>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center space-x-1">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>{extractedData.coachingSessionsTotal || 8} Total Sessions</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {extractedData.coaches.length} Faculty Assigned
                </span>
              </div>
            </div>

            {/* Generated Tranches Breakdown */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                <span>Extracted Commercial Schedule Tranches</span>
                <span className="text-slate-400 font-bold">
                  {extractedData.tenureType === "contract"
                    ? `${extractedData.deliveryMilestones.length} Milestones + ${extractedData.paymentTerms.length} Terms`
                    : extractedData.tenureType === "delivery"
                    ? `${extractedData.deliveryMilestones.length} Milestones`
                    : `${extractedData.paymentTerms.length} Payment Terms`}
                </span>
              </div>

              {/* Milestones list if delivery or contract */}
              {(extractedData.tenureType === "delivery" || extractedData.tenureType === "contract") &&
                extractedData.deliveryMilestones.length > 0 && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block tracking-wider">
                      Delivery Completion Milestones
                    </span>
                    <div className="space-y-1.5">
                      {extractedData.deliveryMilestones.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {m.milestoneTitle}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Work Completion: {m.projectCompletionPercent}% • Target: {m.targetDate || "TBD"}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 block">
                              {m.paymentPercent}% ({formatINR(m.amount)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Payment terms list if payment_terms or contract */}
              {(extractedData.tenureType === "payment_terms" || extractedData.tenureType === "contract") &&
                extractedData.paymentTerms.length > 0 && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block tracking-wider">
                      Advance & Scheduled Payment Tranches
                    </span>
                    <div className="space-y-1.5">
                      {extractedData.paymentTerms.map((t, idx) => (
                        <div
                          key={t.id || idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center space-x-1.5">
                              {t.isAdvance && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[9px] font-black">
                                  ADVANCE
                                </span>
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {t.termLabel}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">
                              Timeframe: {t.timeframe}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                              {t.paymentPercent}% ({formatINR(t.amount)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Commercial Notes / Out of Pocket */}
            {extractedData.commercialNotes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Proposal Commercial Conditions & Taxes:</span>
                </div>
                <p className="text-[11px] leading-relaxed italic">{extractedData.commercialNotes}</p>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>Upload Another Document</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isApplying}
                  onClick={handleConfirmApply}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition flex items-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isApplying
                      ? "Applying to Schedule..."
                      : "✨ Overwrite & Create AI Schedule"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
