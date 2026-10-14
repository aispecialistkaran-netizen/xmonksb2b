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
const TEMPLATES_STORAGE_KEY = "xmonks_b2b_templates_v2";
const DEPRECATED_TEMPLATE_IDS = new Set(["tpl-icici-fin-prop-02", "tpl-icici-zsm-prop-03"]);

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
];

/**
 * Get templates from localStorage with fallback to INITIAL_TEMPLATES
 */
export function getStoredTemplates(): TemplateItem[] {
  if (typeof window === "undefined") return INITIAL_TEMPLATES;
  try {
    // Also clean previous key if it exists
    const legacyRaw = localStorage.getItem("xmonks_b2b_templates_v1");
    let raw = localStorage.getItem(TEMPLATES_STORAGE_KEY) || legacyRaw;
    if (raw) {
      let parsed: TemplateItem[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any deprecated/removed sample templates
        parsed = parsed.filter((t) => !DEPRECATED_TEMPLATE_IDS.has(t.id));

        // Ensure the requested financial proposal template is always present
        const hasMainTemplate = parsed.some(
          (t) =>
            t.fileName === "Template _ Financial  Proposal _ Program Name @ Client Name.doc" ||
            t.id === "tpl-financial-proposal-master-01"
        );
        if (!hasMainTemplate) {
          parsed.unshift(INITIAL_TEMPLATES[0]);
        }
        saveLocalTemplates(parsed);
        // Clear old key
        if (legacyRaw) localStorage.removeItem("xmonks_b2b_templates_v1");
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
    const sanitized = templates.filter((t) => !DEPRECATED_TEMPLATE_IDS.has(t.id));
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(sanitized));
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
            if (DEPRECATED_TEMPLATE_IDS.has(d.id)) {
              // Delete deprecated template from Firestore
              deleteDoc(doc(db, TEMPLATES_COLLECTION, d.id)).catch(() => {});
            } else {
              list.push({ id: d.id, ...d.data() } as TemplateItem);
            }
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
