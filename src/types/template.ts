export type TemplateCategory =
  | "all"
  | "financial_proposals"
  | "case_studies"
  | "product_induction_materials"
  | "approach_notes"
  | (string & {});

export interface TemplateCategoryConfig {
  id: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon?: string;
  isCustom?: boolean;
}

export const INITIAL_TEMPLATE_CATEGORIES: TemplateCategoryConfig[] = [
  {
    id: "financial_proposals",
    label: "Financial Proposals",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/70",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-300 dark:border-emerald-800",
    icon: "Receipt",
  },
  {
    id: "case_studies",
    label: "Case Studies",
    badgeBg: "bg-amber-50 dark:bg-amber-950/70",
    badgeText: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-800",
    icon: "Briefcase",
  },
  {
    id: "product_induction_materials",
    label: "Product and Induction Materials",
    badgeBg: "bg-blue-50 dark:bg-blue-950/70",
    badgeText: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-800",
    icon: "BookOpen",
  },
  {
    id: "approach_notes",
    label: "Approach Notes",
    badgeBg: "bg-purple-50 dark:bg-purple-950/70",
    badgeText: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-800",
    icon: "FileText",
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategoryConfig[] = INITIAL_TEMPLATE_CATEGORIES;

export const CATEGORY_COLOR_PRESETS = [
  {
    name: "Emerald / Green",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/70",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-300 dark:border-emerald-800",
    dotBg: "bg-emerald-500",
  },
  {
    name: "Cyan / Sky",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/70",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    borderColor: "border-cyan-300 dark:border-cyan-800",
    dotBg: "bg-cyan-500",
  },
  {
    name: "Indigo / Violet",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/70",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    borderColor: "border-indigo-300 dark:border-indigo-800",
    dotBg: "bg-indigo-500",
  },
  {
    name: "Rose / Red",
    badgeBg: "bg-rose-50 dark:bg-rose-950/70",
    badgeText: "text-rose-700 dark:text-rose-300",
    borderColor: "border-rose-300 dark:border-rose-800",
    dotBg: "bg-rose-500",
  },
  {
    name: "Amber / Orange",
    badgeBg: "bg-amber-50 dark:bg-amber-950/70",
    badgeText: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-800",
    dotBg: "bg-amber-500",
  },
  {
    name: "Teal / Mint",
    badgeBg: "bg-teal-50 dark:bg-teal-950/70",
    badgeText: "text-teal-700 dark:text-teal-300",
    borderColor: "border-teal-300 dark:border-teal-800",
    dotBg: "bg-teal-500",
  },
  {
    name: "Purple / Fuchsia",
    badgeBg: "bg-purple-50 dark:bg-purple-950/70",
    badgeText: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-800",
    dotBg: "bg-purple-500",
  },
  {
    name: "Slate / Steel",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
    borderColor: "border-slate-300 dark:border-slate-700",
    dotBg: "bg-slate-500",
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
