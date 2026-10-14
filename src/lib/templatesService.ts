import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { TemplateItem, TemplateCategory, TEMPLATE_CATEGORIES } from "@/types/template";
import { formatBytes } from "./formatters";

const TEMPLATES_COLLECTION = "b2b_templates";
const TEMPLATES_STORAGE_KEY = "xmonks_b2b_templates_v1";

// Initial seed templates containing the requested file categorized under "Financial Proposals"
export const INITIAL_TEMPLATES: TemplateItem[] = [
  {
    id: "tpl-financial-proposal-master-01",
    title: "Template _ Financial Proposal _ Program Name @ Client Name",
    fileName: "Template _ Financial  Proposal _ Program Name @ Client Name.doc",
    fileSize: "525.5 KB",
    fileSizeBytes: 538112,
    fileType: "doc",
    category: "financial_proposals",
    categoryLabel: "Financial Proposals",
    description:
      "Standard corporate financial proposal document for enterprise client engagements, pricing structures, phased milestone commercial tables, and terms of engagement.",
    downloadUrl:
      "/Template%20_%20Financial%20%20Proposal%20_%20Program%20Name%20@%20Client%20Name.doc",
    uploadedBy: "Admin",
    uploadedByEmail: "sales@xmonks.com",
    uploadedAt: "2026-10-14T14:39:00.000Z",
    uploadedAtMs: 1791979140000,
    tags: [
      "Financial Proposals",
      "Pricing",
      "Commercial Terms",
      "Enterprise Proposal",
      "Executive Coaching",
      "Milestones",
    ],
    isPinned: true,
    downloadCount: 18,
    version: "v2.4",
  },
  {
    id: "tpl-icici-fin-prop-02",
    title: "Executive Coaching Financial Proposal 2.0 (ICICI Lombard)",
    fileName: "Financial  Proposal 2.0  _ Executive Coaching (Sept 2026) @ ICICI Lombard (1).pdf",
    fileSize: "362.5 KB",
    fileSizeBytes: 371160,
    fileType: "pdf",
    category: "financial_proposals",
    categoryLabel: "Financial Proposals",
    description:
      "Sample executed executive coaching commercial proposal format featuring cohort pricing, diagnostic tranche schedules, and invoicing milestones.",
    downloadUrl:
      "/Financial%20%20Proposal%202.0%20%20_%20Executive%20Coaching%20(Sept%202026)%20@%20ICICI%20Lombard%20(1).pdf",
    uploadedBy: "Admin",
    uploadedByEmail: "sales@xmonks.com",
    uploadedAt: "2026-09-15T10:00:00.000Z",
    uploadedAtMs: 1789466400000,
    tags: ["Financial Proposals", "ICICI Lombard", "Executive Coaching", "Sample PDF"],
    isPinned: false,
    downloadCount: 9,
    version: "v2.0",
  },
  {
    id: "tpl-icici-zsm-prop-03",
    title: "ZSM as Coach Financial Proposal 4.0 (ICICI Lombard)",
    fileName: "Financial Proposal 4.0  _ ZSM as Coach (Aug 2026) @ ICICI Lombard.pdf",
    fileSize: "451.1 KB",
    fileSizeBytes: 461978,
    fileType: "pdf",
    category: "financial_proposals",
    categoryLabel: "Financial Proposals",
    description:
      "Large-scale sales leadership coaching proposal template with multi-phase delivery and staggered payment terms.",
    downloadUrl:
      "/Financial%20Proposal%204.0%20%20_%20ZSM%20as%20Coach%20(Aug%202026)%20@%20ICICI%20Lombard.pdf",
    uploadedBy: "Admin",
    uploadedByEmail: "sales@xmonks.com",
    uploadedAt: "2026-08-20T10:00:00.000Z",
    uploadedAtMs: 1787220000000,
    tags: ["Financial Proposals", "ZSM", "Large Enterprise", "Phased Commercials"],
    isPinned: false,
    downloadCount: 7,
    version: "v4.0",
  },
];

/**
 * Get templates from localStorage with fallback to INITIAL_TEMPLATES
 */
export function getStoredTemplates(): TemplateItem[] {
  if (typeof window === "undefined") return INITIAL_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed: TemplateItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure the requested financial proposal template is always present
        const hasMainTemplate = parsed.some(
          (t) =>
            t.fileName === "Template _ Financial  Proposal _ Program Name @ Client Name.doc" ||
            t.id === "tpl-financial-proposal-master-01"
        );
        if (!hasMainTemplate) {
          parsed.unshift(INITIAL_TEMPLATES[0]);
          saveLocalTemplates(parsed);
        }
        return parsed;
      }
    }
    saveLocalTemplates(INITIAL_TEMPLATES);
    return INITIAL_TEMPLATES;
  } catch (e) {
    console.warn("Failed to read templates from localStorage", e);
    return INITIAL_TEMPLATES;
  }
}

/**
 * Save templates to localStorage
 */
export function saveLocalTemplates(templates: TemplateItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.warn("Failed to save templates to localStorage", e);
  }
}

/**
 * Real-time subscription to templates:
 * Listens to Firestore `b2b_templates` with localStorage fallback.
 */
export function subscribeToTemplates(callback: (templates: TemplateItem[]) => void): () => void {
  const localDocs = getStoredTemplates();
  callback(localDocs);

  if (typeof window === "undefined") return () => {};

  try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy("uploadedAtMs", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: TemplateItem[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as TemplateItem);
          });
          // Ensure seed template is included
          if (!list.some((t) => t.id === INITIAL_TEMPLATES[0].id)) {
            list.unshift(INITIAL_TEMPLATES[0]);
          }
          saveLocalTemplates(list);
          callback(list);
        } else {
          // If Firestore is empty, seed it with INITIAL_TEMPLATES
          INITIAL_TEMPLATES.forEach((tpl) => {
            setDoc(doc(db, TEMPLATES_COLLECTION, tpl.id), tpl, { merge: true }).catch(() => {});
          });
          callback(localDocs);
        }
      },
      (err) => {
        console.warn("Firestore templates subscription error (using local)", err.message);
        callback(getStoredTemplates());
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn("Error subscribing to templates", e);
    return () => {};
  }
}

/**
 * Add or update a template (Admin only)
 */
export async function saveTemplate(template: TemplateItem): Promise<void> {
  const current = getStoredTemplates();
  const existingIdx = current.findIndex((t) => t.id === template.id);
  let updated: TemplateItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = template;
  } else {
    updated = [template, ...current];
  }

  saveLocalTemplates(updated);

  try {
    await setDoc(doc(db, TEMPLATES_COLLECTION, template.id), template, { merge: true });
  } catch (e) {
    console.warn("Failed to sync template to Firestore", e);
  }
}

/**
 * Delete a template (Admin only)
 */
export async function deleteTemplate(id: string): Promise<void> {
  const current = getStoredTemplates();
  const updated = current.filter((t) => t.id !== id);
  saveLocalTemplates(updated);

  try {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
  } catch (e) {
    console.warn("Failed to delete template from Firestore", e);
  }
}

/**
 * Increment download count
 */
export async function recordTemplateDownload(id: string): Promise<void> {
  const current = getStoredTemplates();
  const idx = current.findIndex((t) => t.id === id);
  if (idx >= 0) {
    current[idx].downloadCount = (current[idx].downloadCount || 0) + 1;
    saveLocalTemplates(current);
    try {
      await setDoc(doc(db, TEMPLATES_COLLECTION, id), { downloadCount: current[idx].downloadCount }, { merge: true });
    } catch {
      // offline silent
    }
  }
}

/**
 * Toggle pinned status (Admin only)
 */
export async function togglePinTemplate(id: string): Promise<void> {
  const current = getStoredTemplates();
  const idx = current.findIndex((t) => t.id === id);
  if (idx >= 0) {
    current[idx].isPinned = !current[idx].isPinned;
    saveLocalTemplates(current);
    try {
      await setDoc(doc(db, TEMPLATES_COLLECTION, id), { isPinned: current[idx].isPinned }, { merge: true });
    } catch {
      // offline silent
    }
  }
}
