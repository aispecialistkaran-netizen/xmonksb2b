"use client";

import React, { useState } from "react";
import {
  X,
  Award,
  Star,
  CheckCircle2,
  Printer,
  Sparkles,
  FileText,
  UserCheck,
  Calendar,
  Building2,
} from "lucide-react";
import { DeliveryRecord, ClientSignoff } from "@/types/delivery";

interface ClientSignoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DeliveryRecord;
  onSaveSignoff: (signoff: ClientSignoff) => void;
}

export const ClientSignoffModal: React.FC<ClientSignoffModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveSignoff,
}) => {
  if (!isOpen) return null;

  const existing = record.clientSignoff;
  const [signatoryName, setSignatoryName] = useState(
    existing?.signatoryName || record.contactName || ""
  );
  const [signatoryDesignation, setSignatoryDesignation] = useState(
    existing?.signatoryDesignation || record.designation || "VP Human Resources & L&D"
  );
  const [signatoryEmail, setSignatoryEmail] = useState(
    existing?.signatoryEmail || record.contactEmail || ""
  );
  const [signoffDate, setSignoffDate] = useState(
    existing?.signoffDate || new Date().toISOString().split("T")[0]
  );
  const [feedbackNotes, setFeedbackNotes] = useState(
    existing?.feedbackNotes ||
      "Exceptional leadership transformation journey. Noticeable elevation in cohort emotional intelligence and cross-functional execution."
  );
  const [csatRating, setCsatRating] = useState<number>(existing?.csatRating || 5);
  const [npsScore, setNpsScore] = useState<number>(existing?.npsScore ?? 10);
  const [showCertificate, setShowCertificate] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatoryName.trim()) return;

    const data: ClientSignoff = {
      signatoryName: signatoryName.trim(),
      signatoryDesignation: signatoryDesignation.trim(),
      signatoryEmail: signatoryEmail.trim() || undefined,
      signoffDate,
      feedbackNotes,
      csatRating,
      npsScore,
      certificateGenerated: true,
      certificateDate: new Date().toISOString().split("T")[0],
    };

    onSaveSignoff(data);
    setShowCertificate(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden print:m-0 print:border-none print:shadow-none">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-xl text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Client Completion Sign-off & CSAT Pulse
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Record formal enterprise acceptance, CSAT/NPS rating, and generate completion certificate.
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

        {/* Certificate View (If already signed or viewed) */}
        {showCertificate ? (
          <div className="p-8 space-y-6">
            <div className="border-4 border-double border-amber-300 dark:border-amber-700/60 p-8 rounded-2xl bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 text-center space-y-5 print:border-amber-600">
              <div className="flex justify-center items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Certificate of Program Completion
                </span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  This certifies that the enterprise executive engagement for
                </p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {record.companyName}
                </h2>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {record.program || "Executive Leadership & Transformation Journey"}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                has been successfully delivered, validated, and signed off in accordance with
                ICF Executive Coaching standards & xMonks Enterprise Curriculum frameworks.
              </p>

              {/* CSAT Rating Seal */}
              <div className="flex justify-center items-center space-x-1.5 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= csatRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                ))}
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 ml-2">
                  CSAT: {csatRating}/5 • NPS: {npsScore}/10
                </span>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-amber-200 dark:border-amber-900/40 text-xs">
                <div>
                  <div className="font-serif italic font-bold text-base text-slate-800 dark:text-slate-200">
                    {signatoryName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {signatoryDesignation}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    Client Authorizer • {signoffDate}
                  </div>
                </div>

                <div>
                  <div className="font-serif italic font-bold text-base text-indigo-700 dark:text-indigo-400">
                    {record.clientPartner}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Managing Partner, xMonks
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    Delivery Directorate
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setShowCertificate(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer"
              >
                ← Edit Sign-off Details
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Sign-off Input Form */
          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-amber-800 dark:text-amber-300">
                Signing off this program records completion feedback and elevates account CSAT for portfolio renewals.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Client Signatory Name *
                </label>
                <input
                  type="text"
                  required
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Signatory Designation *
                </label>
                <input
                  type="text"
                  required
                  value={signatoryDesignation}
                  onChange={(e) => setSignatoryDesignation(e.target.value)}
                  placeholder="e.g. Chief Human Resources Officer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Sign-off Date
                </label>
                <input
                  type="date"
                  value={signoffDate}
                  onChange={(e) => setSignoffDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Signatory Email
                </label>
                <input
                  type="email"
                  value={signatoryEmail}
                  onChange={(e) => setSignatoryEmail(e.target.value)}
                  placeholder="priya.nair@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* CSAT Star Rating & NPS Slider */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase text-slate-500 block">
                    Client Satisfaction Rating (CSAT)
                  </span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCsatRating(star)}
                        className="cursor-pointer transition hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= csatRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-black text-sm text-slate-800 dark:text-slate-200">
                      {csatRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-black uppercase text-slate-500 block">
                    Net Promoter Score (NPS: 0-10)
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={npsScore}
                      onChange={(e) => setNpsScore(Number(e.target.value))}
                      className="cursor-pointer"
                    />
                    <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                      {npsScore}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Executive Feedback & Outcome Testimonial
              </label>
              <textarea
                rows={3}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Enter client comments, business impact notes, or testimonial quotes..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Save Sign-off & View Certificate</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
