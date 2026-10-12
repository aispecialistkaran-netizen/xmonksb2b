import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import {
  TenureType,
  DeliveryMilestoneTranche,
  PaymentTermTranche,
  CoachAssignment,
} from "@/types/delivery";

// Dynamically resolve pdf-parse to avoid Next.js bundling issues
function getPdfParser() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const req = eval("require");
    return req(path.join(process.cwd(), "node_modules/pdf-parse/index.js"));
  } catch (err) {
    console.warn("Dynamic pdf-parse load warning:", err);
    return null;
  }
}

export const dynamic = "force-dynamic";

interface ExtractedProposalData {
  clientName: string;
  programName: string;
  dealValue: number;
  currency: string;
  tenureType: TenureType;
  tenureTypeExplanation: string;
  deliveryMilestones: Array<{
    milestoneTitle: string;
    projectCompletionPercent: number;
    paymentPercent: number;
    amount: number;
    targetDate?: string;
  }>;
  paymentTerms: Array<{
    termLabel: string;
    isAdvance?: boolean;
    timeframe: string;
    paymentPercent: number;
    amount: number;
    dueDate?: string;
  }>;
  coachingDetails?: {
    totalSessions?: number;
    coaches?: Array<{
      name: string;
      role: "lead_facilitator" | "executive_coach" | "program_manager" | "faculty";
      assignedSessions?: number;
    }>;
  };
  commercialNotes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey =
      process.env.gemini_api_key ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini API key is not configured. Please ensure 'gemini_api_key' is set in your .env file.",
        },
        { status: 400 }
      );
    }

    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let mimeType = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const useSample = formData.get("useSample") === "true";

      if (useSample) {
        const samplePath = path.join(
          process.cwd(),
          "public",
          "Financial  Proposal 2.0  _ Executive Coaching (Sept 2026) @ ICICI Lombard (1).pdf"
        );
        if (fs.existsSync(samplePath)) {
          fileBuffer = fs.readFileSync(samplePath);
          fileName = "Financial Proposal 2.0 _ Executive Coaching @ ICICI Lombard.pdf";
          mimeType = "application/pdf";
        }
      } else if (file) {
        fileName = file.name;
        mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      // JSON body with base64 data or sample flag
      const body = await req.json();
      if (body.useSample) {
        const samplePath = path.join(
          process.cwd(),
          "public",
          "Financial  Proposal 2.0  _ Executive Coaching (Sept 2026) @ ICICI Lombard (1).pdf"
        );
        if (fs.existsSync(samplePath)) {
          fileBuffer = fs.readFileSync(samplePath);
          fileName = "Financial Proposal 2.0 _ Executive Coaching @ ICICI Lombard.pdf";
          mimeType = "application/pdf";
        }
      } else if (body.fileBase64) {
        fileBuffer = Buffer.from(body.fileBase64, "base64");
        fileName = body.fileName || "proposal.pdf";
        mimeType = body.mimeType || "application/pdf";
      }
    }

    if (!fileBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: "No document provided. Please upload a PDF or DOCX file.",
        },
        { status: 400 }
      );
    }

    // Step 1: Extract text from PDF or DOCX
    let extractedText = "";
    const isDocx =
      fileName.toLowerCase().endsWith(".docx") ||
      mimeType.includes("wordprocessingml") ||
      fileName.toLowerCase().endsWith(".doc");

    if (isDocx) {
      try {
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docxResult.value || "";
      } catch (docxErr) {
        console.error("Mammoth DOCX parse error:", docxErr);
      }
    } else {
      // Default to PDF parsing
      try {
        const parser = getPdfParser();
        if (parser) {
          const pdfData = await parser(fileBuffer);
          extractedText = pdfData.text || "";
        }
      } catch (pdfErr) {
        console.error("pdfParse error:", pdfErr);
      }
    }

    const hasRichText = extractedText && extractedText.trim().length > 100;

    // Step 2: Formulate prompt for Gemini
    const systemPrompt = `You are an expert commercial contract and financial proposal analyst for xMonks (Inspire Coaching Systems), an executive coaching, leadership development, and organizational transformation firm.

Analyze the uploaded proposal/contract document and extract the structured Delivery & Tenure Schedule.

Key Guidelines for Tenure Type Classification:
1. "delivery": Selected when the engagement is structured by progress milestones / deliverables (e.g., 20% Kickoff & Diagnostic, 40% Mid-Term Review & Cohort Deliverables, 40% Completion Report & Sign-off).
2. "payment_terms": Selected when the commercials specify advance and scheduled time/tranche payments (e.g., 40% Advance upon confirmation, 30% after fourth session or 3 months, 30% upon completion).
3. "contract": Selected when it is a hybrid combination of both delivery milestone tranches AND advance/scheduled payment terms.

Instructions:
- Extract the Client Name and Program Name.
- Extract total deal value in INR without commas (numbers only).
- If tenureType is "payment_terms" or "contract", populate paymentTerms with exact percentages and amounts adding up to 100% and deal value.
- If tenureType is "delivery" or "contract", populate deliveryMilestones with exact completion percentages, payment release percentages, and amounts.
- Extract any coaching faculty details (total sessions count, ICF executive coach roles, facilitator roles).
- Summarize commercial notes (GST treatment, assessment tools like LCP 360, travel/out-of-pocket expenses).

Output STRICT JSON schema:
{
  "clientName": string,
  "programName": string,
  "dealValue": number,
  "currency": "INR",
  "tenureType": "delivery" | "payment_terms" | "contract",
  "tenureTypeExplanation": string,
  "deliveryMilestones": [
    {
      "milestoneTitle": string,
      "projectCompletionPercent": number,
      "paymentPercent": number,
      "amount": number,
      "targetDate": string
    }
  ],
  "paymentTerms": [
    {
      "termLabel": string,
      "isAdvance": boolean,
      "timeframe": string,
      "paymentPercent": number,
      "amount": number,
      "dueDate": string
    }
  ],
  "coachingDetails": {
    "totalSessions": number,
    "coaches": [
      {
        "name": string,
        "role": "lead_facilitator" | "executive_coach" | "program_manager" | "faculty",
        "assignedSessions": number
      }
    ]
  },
  "commercialNotes": string
}`;

    // Step 3: Call Gemini with fallback models
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    let geminiResponseText: string | null = null;
    let successfulModel = "";
    let lastError = "";

    // Prepare content payload
    const contents: Array<{
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    if (hasRichText) {
      contents.push({
        parts: [
          {
            text: `${systemPrompt}\n\nDocument Text Content (${fileName}):\n"""\n${extractedText.slice(0, 50000)}\n"""`,
          },
        ],
      });
    } else {
      // Fallback to multimodal inline PDF
      contents.push({
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "application/pdf",
              data: fileBuffer.toString("base64"),
            },
          },
          {
            text: systemPrompt,
          },
        ],
      });
    }

    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const resJson = await response.json();
          const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            geminiResponseText = text;
            successfulModel = model;
            break;
          }
        } else {
          const errData = await response.json().catch(() => null);
          lastError =
            errData?.error?.message || `HTTP ${response.status} from ${model}`;
        }
      } catch (fetchErr: unknown) {
        lastError =
          fetchErr instanceof Error ? fetchErr.message : "Fetch aborted/timeout";
      }
    }

    if (!geminiResponseText) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to analyze document with Gemini AI: ${lastError}`,
        },
        { status: 502 }
      );
    }

    // Step 4: Parse & validate JSON
    let parsed: ExtractedProposalData;
    try {
      parsed = JSON.parse(geminiResponseText);
    } catch {
      // Try stripping markdown blocks
      const cleanJson = geminiResponseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      parsed = JSON.parse(cleanJson);
    }

    const totalDealValue = Number(parsed.dealValue) || 0;

    // Normalize Delivery Milestones
    const normalizedMilestones: DeliveryMilestoneTranche[] = (
      parsed.deliveryMilestones || []
    ).map((m, idx) => ({
      id: `m-ai-${Date.now()}-${idx + 1}`,
      milestoneTitle: m.milestoneTitle || `Milestone ${idx + 1}`,
      projectCompletionPercent: Number(m.projectCompletionPercent) || 0,
      paymentPercent: Number(m.paymentPercent) || 0,
      amount:
        Number(m.amount) ||
        Math.round(totalDealValue * ((Number(m.paymentPercent) || 0) / 100)),
      targetDate: m.targetDate || "",
      milestoneStatus: "pending",
      paymentStatus: "pending",
    }));

    // Normalize Payment Terms
    const normalizedTerms: PaymentTermTranche[] = (
      parsed.paymentTerms || []
    ).map((t, idx) => ({
      id: `term-ai-${Date.now()}-${idx + 1}`,
      termLabel: t.termLabel || `Tranche ${idx + 1}`,
      isAdvance: Boolean(t.isAdvance || idx === 0),
      timeframe: t.timeframe || (idx === 0 ? "Advance" : "Scheduled"),
      paymentPercent: Number(t.paymentPercent) || 0,
      amount:
        Number(t.amount) ||
        Math.round(totalDealValue * ((Number(t.paymentPercent) || 0) / 100)),
      dueDate: t.dueDate || "",
      paymentStatus: "pending",
    }));

    // Normalize Coaches
    const normalizedCoaches: CoachAssignment[] = (
      parsed.coachingDetails?.coaches || []
    ).map((c, idx) => ({
      id: `coach-ai-${Date.now()}-${idx + 1}`,
      name: c.name || "Assigned Executive Coach",
      role: c.role || "executive_coach",
      assignedSessionsCount:
        Number(c.assignedSessions) ||
        Number(parsed.coachingDetails?.totalSessions) ||
        8,
      completedSessionsCount: 0,
    }));

    // Ensure at least one set of items exists according to tenureType
    if (parsed.tenureType === "delivery" && normalizedMilestones.length === 0) {
      // Fallback generate default delivery milestones
      normalizedMilestones.push(
        {
          id: `m-ai-1`,
          milestoneTitle: "20% Project Kickoff & Executive Diagnostic",
          projectCompletionPercent: 20,
          paymentPercent: 20,
          amount: Math.round(totalDealValue * 0.2),
          milestoneStatus: "pending",
          paymentStatus: "pending",
        },
        {
          id: `m-ai-2`,
          milestoneTitle: "60% Mid-Term Coaching Review & Delivery",
          projectCompletionPercent: 60,
          paymentPercent: 40,
          amount: Math.round(totalDealValue * 0.4),
          milestoneStatus: "pending",
          paymentStatus: "pending",
        },
        {
          id: `m-ai-3`,
          milestoneTitle: "100% Program Wrap-up & Completion Report",
          projectCompletionPercent: 100,
          paymentPercent: 40,
          amount: Math.round(totalDealValue * 0.4),
          milestoneStatus: "pending",
          paymentStatus: "pending",
        }
      );
    } else if (
      parsed.tenureType === "payment_terms" &&
      normalizedTerms.length === 0
    ) {
      normalizedTerms.push(
        {
          id: `term-ai-1`,
          termLabel: "Advance Payment upon Confirmation",
          isAdvance: true,
          timeframe: "Advance (Immediate)",
          paymentPercent: 40,
          amount: Math.round(totalDealValue * 0.4),
          paymentStatus: "pending",
        },
        {
          id: `term-ai-2`,
          termLabel: "Installment 1 - Mid-Point Review",
          isAdvance: false,
          timeframe: "After Session 4",
          paymentPercent: 30,
          amount: Math.round(totalDealValue * 0.3),
          paymentStatus: "pending",
        },
        {
          id: `term-ai-3`,
          termLabel: "Final Installment upon Completion",
          isAdvance: false,
          timeframe: "Engagement Closure",
          paymentPercent: 30,
          amount: Math.round(totalDealValue * 0.3),
          paymentStatus: "pending",
        }
      );
    }

    return NextResponse.json({
      success: true,
      modelUsed: successfulModel,
      fileName,
      data: {
        clientName: parsed.clientName || "",
        programName: parsed.programName || "",
        dealValue: totalDealValue,
        tenureType: parsed.tenureType || "payment_terms",
        tenureTypeExplanation: parsed.tenureTypeExplanation || "",
        deliveryMilestones: normalizedMilestones,
        paymentTerms: normalizedTerms,
        coachingSessionsTotal:
          Number(parsed.coachingDetails?.totalSessions) || 8,
        coaches: normalizedCoaches,
        commercialNotes: parsed.commercialNotes || "",
      },
    });
  } catch (err: unknown) {
    console.error("API /api/delivery/parse-proposal error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during proposal parsing.",
      },
      { status: 500 }
    );
  }
}
