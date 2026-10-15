export type TemplateCategory =
  | "all"
  | "financial_proposals"
  | "case_studies"
  | "product_induction_materials"
  | "approach_notes";

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
