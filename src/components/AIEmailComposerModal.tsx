"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  Eye,
  Code,
  Paperclip,
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Mail,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ColdClient, OutreachChannel, ColdClientStatus } from "@/types/outreach";
import { UserAccount } from "@/constants/users";
import {
  generateAIEmailTemplate,
  getStoredGeminiKey,
} from "@/lib/geminiService";
import {
  sendEmailCampaign,
  getAllSenderProfiles,
  getSenderProfileForUser,
  saveCustomTemplate,
} from "@/lib/emailService";
import { EmailAttachment } from "@/constants/emailTemplates";
import { AttachFromLibraryModal } from "./AttachFromLibraryModal";

interface AIEmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ColdClient;
  currentUser?: UserAccount | null;
  onLogTouchpoint: (
    clientId: string,
    touchpoint: {
      channel: OutreachChannel | "note";
      summary: string;
      author: string;
      nextStatus?: ColdClientStatus;
      nextFollowUpDate?: string;
      nextFollowUpTime?: string;
      activityDate?: string;
      activityTime?: string;
    }
  ) => Promise<void>;
  onEmailSentSuccessfully?: (summary: string) => void;
}

export const AIEmailComposerModal: React.FC<AIEmailComposerModalProps> = ({
  isOpen,
  onClose,
  client,
  currentUser,
  onLogTouchpoint,
  onEmailSentSuccessfully,
}) => {
  // Input parameters
  const [context, setContext] = useState<string>("");
  const [tone, setTone] = useState<string>("warm");
  const [program, setProgram] = useState<string>(
    client.targetProgram || "Executive Coaching"
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generated email outputs
  const [generatedSubject, setGeneratedSubject] = useState<string>("");
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [generatedSummary, setGeneratedSummary] = useState<string>("");

  // Editor view: "preview" vs "source"
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");

  // Email sending parameters
  const [emailCc, setEmailCc] = useState<string>("");
  const [emailBcc, setEmailBcc] = useState<string>("");
  const [showCcBcc, setShowCcBcc] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);

  // Sending state
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isCopiedHtml, setIsCopiedHtml] = useState<boolean>(false);
  const [isSavedAsTemplate, setIsSavedAsTemplate] = useState<boolean>(false);

  // Context presets tailored to the client
  const contextPresets = [
    {
      label: "Leadership Coaching Intro",
      text: `Warm introduction for ${client.contactName} regarding xMonks 1-on-1 Executive Coaching for senior leaders at ${client.companyName}. Emphasize our ICF-certified coaching framework, behavioral transformation, and propose a 15-minute discovery conversation next week.`,
    },
    {
      label: "L&D Capability Proposal",
      text: `Executive pitch on how xMonks partners with ${client.industry || "corporate"} organizations to elevate enterprise L&D. Propose tailoring a customized capability journey for ${client.companyName} with measurable business ROI.`,
    },
    {
      label: "Warm Touchpoint Follow-up",
      text: `Friendly follow-up with ${client.contactName} at ${client.companyName}. Acknowledge their busy schedule, share our recent leadership development insights, and check if revisiting our collaboration makes sense this quarter.`,
    },
    {
      label: "15-Min Discovery Call",
      text: `Direct, value-packed invitation for a 15-minute introductory Zoom connect with ${client.contactName} next Tuesday or Wednesday to explore executive alignment and team performance at ${client.companyName}.`,
    },
  ];

  // Set default context prompt when modal opens
  useEffect(() => {
    if (isOpen && !context.trim()) {
      setContext(
        `Personalized outreach for ${client.contactName} (${client.designation || "Leader"}) at ${client.companyName} (${client.industry || "Enterprise"}). Introduce xMonks Executive Coaching & Leadership Development solutions, highlight measurable organizational impact, and invite them for a brief discovery discussion.`
      );
      if (client.targetProgram) {
        setProgram(client.targetProgram);
      }
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const senderProfiles = getAllSenderProfiles();
  const activeSender = getSenderProfileForUser(senderProfiles, currentUser);

  // Handler: Generate Email via Gemini
  const handleGenerate = async () => {
    if (!context.trim()) {
      setGenerationError("Please enter some context or instructions for AI.");
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationError(null);
      setSendError(null);

      const result = await generateAIEmailTemplate({
        context: context.trim(),
        tone,
        program,
        senderName: currentUser?.name || activeSender.senderName || "Amit Shelly",
        contactName: client.contactName,
        companyName: client.companyName,
        designation: client.designation,
        industry: client.industry,
        clientNotes: client.notes,
        apiKey: getStoredGeminiKey(),
      });

      if (result.success && result.htmlContent) {
        setGeneratedSubject(result.subject || `Strategic Collaboration for ${client.companyName}`);
        setGeneratedHtml(result.htmlContent);
        setGeneratedSummary(result.summary || "AI-generated tailored email");
      } else {
        setGenerationError(
          result.error ||
            "Failed to generate email content. Please verify that your Gemini API key is valid in .env."
        );
      }
    } catch (err: unknown) {
      console.error("AI Email generation error:", err);
      setGenerationError(
        err instanceof Error ? err.message : "Error connecting to AI service."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Send generated email via SMTP
  const handleSendEmail = async () => {
    if (!client.email || !client.email.includes("@")) {
      setSendError("Client does not have a valid email address.");
      return;
    }

    if (!generatedHtml || !generatedSubject) {
      setSendError("Please generate or enter an email subject and content before sending.");
      return;
    }

    try {
      setIsSending(true);
      setSendError(null);

      const payload = {
        recipients: [
          {
            email: client.email.trim(),
            contactName: client.contactName,
            name: client.contactName,
            companyName: client.companyName,
            designation: client.designation,
            industry: client.industry,
            cc: emailCc ? emailCc.trim() : undefined,
            bcc: emailBcc ? emailBcc.trim() : undefined,
            senderUser: currentUser,
          },
        ],
        subject: generatedSubject,
        htmlContent: generatedHtml,
        smtpConfig: activeSender,
        attachments: attachments,
        cc: emailCc ? emailCc.trim() : undefined,
        bcc: emailBcc ? emailBcc.trim() : undefined,
        senderUser: currentUser,
      };

      const res = await sendEmailCampaign(payload);

      if (res.success && res.sentCount > 0) {
        // Celebrate
        try {
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.4 },
          });
        } catch {}

        // Log touchpoint in Touchpoint History
        const attSnippet =
          attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : "";
        const ccSnippet = emailCc ? ` (CC: ${emailCc})` : "";
        const summaryText = `Sent AI-generated email to ${client.email}${ccSnippet} with subject: "${generatedSubject}"${attSnippet}.`;

        await onLogTouchpoint(client.id, {
          channel: "email",
          summary: summaryText,
          author: currentUser?.name || activeSender.senderName || "Sales Representative",
          activityDate: new Date().toISOString().split("T")[0],
          activityTime: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        });

        if (onEmailSentSuccessfully) {
          onEmailSentSuccessfully(summaryText);
        }

        onClose();
      } else {
        const errorDetail =
          res.results?.[0]?.error ||
          res.error ||
          "Failed to send email. Please check your SMTP settings.";
        setSendError(errorDetail);
      }
    } catch (err: unknown) {
      console.error("Error sending AI email:", err);
      setSendError(
        err instanceof Error ? err.message : "Failed to dispatch email via SMTP."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyHtml = () => {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml);
    setIsCopiedHtml(true);
    setTimeout(() => setIsCopiedHtml(false), 2000);
  };

  const handleSaveAsTemplate = () => {
    if (!generatedHtml || !generatedSubject) return;
    saveCustomTemplate({
      name: `AI: ${client.companyName} - ${generatedSubject.slice(0, 30)}`,
      category: "outreach",
      subject: generatedSubject,
      htmlContent: generatedHtml,
      description: `Generated for ${client.contactName} at ${client.companyName}`,
      owner: currentUser?.username || "sales",
    });
    setIsSavedAsTemplate(true);
    setTimeout(() => setIsSavedAsTemplate(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Send Email via AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Google Gemini Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target: <span className="font-bold text-slate-700 dark:text-slate-200">{client.contactName}</span> ({client.email || "No email"}) •{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{client.companyName}</span>
                {client.designation ? ` (${client.designation})` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Top Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Tone of Voice
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="warm">Warm & Consultative (Recommended)</option>
                <option value="executive">Executive & Direct (CXO Level)</option>
                <option value="persuasive">Persuasive & Value-Driven</option>
                <option value="urgent">Time-Sensitive / Quarter End</option>
                <option value="crisp">Crisp & Brief (Quick Ping)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Program / Offering
              </label>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="e.g. Executive Coaching, L&D Transformation"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Sender Profile
              </label>
              <div className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 truncate">
                {activeSender.senderName} &lt;{activeSender.userEmail}&gt;
              </div>
            </div>
          </div>

          {/* Context Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                <span>Input Business Context & Objectives</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                  AI will convert this into HTML
                </span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {context.length} characters
              </span>
            </div>

            <textarea
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={`Enter context for ${client.contactName} at ${client.companyName}... e.g. We met at the HR summit, discuss executive coaching for senior leadership, offer a 15-minute introductory call next week.`}
              className="w-full p-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y leading-relaxed"
            />

            {/* Quick Context Idea Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">
                Quick ideas:
              </span>
              {contextPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setContext(preset.text)}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-purple-200 dark:border-purple-800/80 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action: Generate Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !context.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{generatedHtml ? "Regenerate / Refine with AI" : "✨ Generate Beautiful HTML Email"}</span>
                </>
              )}
            </button>

            {generatedHtml && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Generated successfully! Ready to review & send.</span>
              </span>
            )}
          </div>

          {generationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

          {/* Generated Result Section */}
          {generatedHtml && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
              
              {/* Subject Line Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email Subject Line
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generatedSubject}
                    onChange={(e) => setGeneratedSubject(e.target.value)}
                    placeholder="Subject line..."
                    className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(!showCcBcc)}
                    className="px-2.5 py-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition cursor-pointer"
                  >
                    CC / BCC {showCcBcc ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* CC & BCC optional inputs */}
              {showCcBcc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                      CC Recipients (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      placeholder="e.g. colleague@xmonks.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                      BCC Recipients (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={emailBcc}
                      onChange={(e) => setEmailBcc(e.target.value)}
                      placeholder="e.g. archive@xmonks.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Attachments Row */}
              <div className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Attachments ({attachments.length}/6)
                  </span>
                  {attachments.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {attachments.map((att) => (
                        <span
                          key={att.id}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium flex items-center space-x-1"
                        >
                          <span className="truncate max-w-[120px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                            }
                            className="text-purple-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 rounded-lg transition cursor-pointer"
                >
                  + Add from Library
                </button>
              </div>

              {/* View Switcher: Live Preview vs. Source Editor */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      activeTab === "preview"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live HTML Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("source")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      activeTab === "source"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Edit HTML Source</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1 cursor-pointer"
                    title="Copy full HTML"
                  >
                    {isCopiedHtml ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy HTML</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1 cursor-pointer"
                    title="Save this to Template Library"
                  >
                    {isSavedAsTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-bold">Saved!</span>
                      </>
                    ) : (
                      <>
                        <span>Save to Templates</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab: Live Preview */}
              {activeTab === "preview" && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 sm:p-4">
                  <div className="max-w-[620px] mx-auto bg-white rounded-xl shadow-md overflow-hidden text-slate-900">
                    <iframe
                      srcDoc={generatedHtml}
                      title="AI Email Preview"
                      sandbox="allow-same-origin"
                      className="w-full min-h-[380px] h-[440px] border-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Tab: Edit Source */}
              {activeTab === "source" && (
                <div className="space-y-1">
                  <textarea
                    rows={14}
                    value={generatedHtml}
                    onChange={(e) => setGeneratedHtml(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    You can edit the HTML code directly before dispatching.
                  </p>
                </div>
              )}

              {sendError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {generatedHtml && (
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || !client.email}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center space-x-2 hover:scale-102 active:scale-98 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Dispatching via SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Email to {client.contactName}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attach from Library Modal */}
      {isAttachModalOpen && (
        <AttachFromLibraryModal
          isOpen={isAttachModalOpen}
          onClose={() => setIsAttachModalOpen(false)}
          alreadyAttachedIds={attachments.map((a) => a.id)}
          onAttach={(newAtts: EmailAttachment[]) => {
            setAttachments((prev) => {
              const combined = [...prev];
              for (const a of newAtts) {
                if (!combined.some((item) => item.id === a.id)) {
                  combined.push(a);
                }
              }
              return combined.slice(0, 6);
            });
            setIsAttachModalOpen(false);
          }}
          maxSelectable={Math.max(1, 6 - attachments.length)}
          currentUser={currentUser}
          isAdmin={
            currentUser?.username?.toLowerCase() === "admin" ||
            currentUser?.role?.toLowerCase().includes("admin")
          }
        />
      )}
    </div>
  );
};
