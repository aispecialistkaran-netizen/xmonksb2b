export type TemplateCategory =
  | "all"
  | "financial_proposals"
  | "product_induction_materials"
  | "commercial_contracts"
  | "executive_coaching"
  | "ld_transformation"
  | "diagnostic_assessments"
  | "outreach_sequences"
  | "other";

export interface TemplateCategoryConfig {
  id: TemplateCategory;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategoryConfig[] = [
  {
    id: "financial_proposals",
    label: "Financial Proposals",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/70",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-300 dark:border-emerald-800",
    icon: "Receipt",
  },
  {
    id: "product_induction_materials",
    label: "Product & Induction Materials",
    badgeBg: "bg-blue-50 dark:bg-blue-950/70",
    badgeText: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-800",
    icon: "BookOpen",
  },
  {
    id: "commercial_contracts",
    label: "Commercial Contracts & SOW",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/70",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    borderColor: "border-indigo-300 dark:border-indigo-800",
    icon: "FileCheck",
  },
  {
    id: "executive_coaching",
    label: "Executive Coaching Proposals",
    badgeBg: "bg-purple-50 dark:bg-purple-950/70",
    badgeText: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-800",
    icon: "Award",
  },
  {
    id: "ld_transformation",
    label: "L&D Transformation Proposals",
    badgeBg: "bg-blue-50 dark:bg-blue-950/70",
    badgeText: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-800",
    icon: "Layers",
  },
  {
    id: "diagnostic_assessments",
    label: "Diagnostics & Assessments",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/70",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    borderColor: "border-cyan-300 dark:border-cyan-800",
    icon: "Target",
  },
  {
    id: "outreach_sequences",
    label: "Email & Outreach Sequences",
    badgeBg: "bg-amber-50 dark:bg-amber-950/70",
    badgeText: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-800",
    icon: "Mail",
  },
  {
    id: "other",
    label: "Other Assets",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
    borderColor: "border-slate-300 dark:border-slate-700",
    icon: "FileText",
  },
];

export interface TemplateItem {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileSizeBytes: number;
  fileType: string; // e.g. "doc", "docx", "pdf", "xlsx"
  category: TemplateCategory;
  categoryLabel: string;
  description: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedByEmail?: string;
  uploadedAt: string; // ISO string
  uploadedAtMs: number;
  tags: string[];
  isPinned?: boolean;
  downloadCount: number;
  version?: string;
}
