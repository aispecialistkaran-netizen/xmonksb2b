"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  Plus,
  Star,
  Download,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  FileCheck,
  File,
  Award,
  Layers,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Tag,
  CheckCircle2,
  AlertCircle,
  Copy,
  FolderArchive,
  Receipt,
  Target,
  Mail,
  ShieldCheck,
  Clock,
  Pin,
  ArrowDownToLine,
  Share2,
  CheckSquare,
  Square,
  MinusSquare,
  SlidersHorizontal,
  Palette,
  FolderPlus,
} from "lucide-react";
import {
  TemplateItem,
  TemplateCategory,
  TemplateCategoryConfig,
  TEMPLATE_CATEGORIES,
  CATEGORY_COLOR_PRESETS,
} from "@/types/template";
import {
  subscribeToTemplates,
  subscribeToCategories,
  getStoredCategories,
  saveCategory,
  deleteCustomCategory,
  saveTemplate,
  saveTemplatesBatch,
  deleteTemplate,
  recordTemplateDownload,
  togglePinTemplate,
  bulkUpdateTemplates,
  bulkDeleteTemplates,
  bulkTogglePinTemplates,
  INITIAL_TEMPLATES,
} from "@/lib/templatesService";
import { UserAccount } from "@/constants/users";
import { formatBytes } from "@/lib/formatters";

export interface QueuedTemplateFile {
  id: string;
  file: File;
  fileName: string;
  title: string;
  category: TemplateCategory;
  fileSize: string;
  fileSizeBytes: number;
  fileType: string;
}

interface TemplatesTabProps {
  currentUser?: UserAccount | null;
  isAdmin?: boolean;
}

type ViewMode = "grid" | "table";
type SortOption = "newest" | "downloads" | "title" | "size";

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  currentUser,
  isAdmin = false,
}) => {
  const [templates, setTemplates] = useState<TemplateItem[]>(() => INITIAL_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Admin Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  // Multi-upload Queue & Drag State
  const [queuedFiles, setQueuedFiles] = useState<QueuedTemplateFile[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName?: string;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form / Batch Shared State
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<TemplateCategory>("financial_proposals");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formTags, setFormTags] = useState<string>("");
  const [formVersion, setFormVersion] = useState<string>("v1.0");
  const [formFileName, setFormFileName] = useState<string>("");
  const [formFileSize, setFormFileSize] = useState<string>("500 KB");
  const [formFileSizeBytes, setFormFileSizeBytes] = useState<number>(512000);
  const [formFileType, setFormFileType] = useState<string>("doc");
  const [formDownloadUrl, setFormDownloadUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-select & Bulk Edit State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState<boolean>(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [bulkCategory, setBulkCategory] = useState<string>("keep");
  const [bulkVersion, setBulkVersion] = useState<string>("");
  const [bulkTagsMode, setBulkTagsMode] = useState<"append" | "replace">("append");
  const [bulkTagsInput, setBulkTagsInput] = useState<string>("");
  const [bulkPinAction, setBulkPinAction] = useState<"keep" | "pin" | "unpin">("keep");
  const [isBulkApplying, setIsBulkApplying] = useState<boolean>(false);

  // Category State & Custom Categories
  const [categories, setCategories] = useState<TemplateCategoryConfig[]>(() => getStoredCategories());
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [selectedColorPresetIndex, setSelectedColorPresetIndex] = useState<number>(0);
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time synchronization for templates and categories
  useEffect(() => {
    const unsubTemplates = subscribeToTemplates((data) => {
      setTemplates(data);
    });
    const unsubCategories = subscribeToCategories((catData) => {
      setCategories(catData);
    });
    return () => {
      unsubTemplates();
      unsubCategories();
    };
  }, []);

  const isUserAdmin =
    isAdmin ||
    currentUser?.username?.toLowerCase() === "admin" ||
    currentUser?.role?.toLowerCase().includes("admin");

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    categories.forEach((c) => {
      counts[c.id] = templates.filter((t) => t.category === c.id).length;
    });
    return counts;
  }, [templates, categories]);

  // Filtered & sorted templates
  const filteredTemplates = useMemo(() => {
    let result = templates.filter((tpl) => {
      // Category filter
      if (selectedCategory !== "all" && tpl.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = tpl.title.toLowerCase().includes(q);
        const inFileName = tpl.fileName.toLowerCase().includes(q);
        const inDesc = tpl.description.toLowerCase().includes(q);
        const inTags = (tpl.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const inCategory = tpl.categoryLabel.toLowerCase().includes(q);
        if (!inTitle && !inFileName && !inDesc && !inTags && !inCategory) {
          return false;
        }
      }
      return true;
    });

    // Sorting: pinned items always float to the top
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === "downloads") {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "size") {
        return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
      }
      // "newest" by default
      return (b.uploadedAtMs || 0) - (a.uploadedAtMs || 0);
    });

    return result;
  }, [templates, selectedCategory, searchQuery, sortBy]);

  // Download Handler
  const handleDownload = async (template: TemplateItem) => {
    await recordTemplateDownload(template.id);
    const link = document.createElement("a");
    link.href = template.downloadUrl;
    link.download = template.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Download Link Handler
  const handleCopyLink = (template: TemplateItem) => {
    const fullUrl = `${window.location.origin}${template.downloadUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Multi-Select Helpers & Actions
  const toggleSelectOne = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const deselectAll = () => setSelectedIds(new Set());

  const isAllVisibleSelected =
    filteredTemplates.length > 0 &&
    filteredTemplates.every((t) => selectedIds.has(t.id));

  const isSomeVisibleSelected =
    filteredTemplates.some((t) => selectedIds.has(t.id)) && !isAllVisibleSelected;

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTemplates.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTemplates.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const handleQuickBulkMoveCategory = async (newCategory: TemplateCategory) => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const catObj = categories.find((c) => c.id === newCategory);
    setIsBulkApplying(true);
    try {
      await bulkUpdateTemplates(Array.from(selectedIds), {
        category: newCategory,
        categoryLabel: catObj?.label || newCategory,
      });
      setSuccessToast(`Moved ${count} templates to "${catObj?.label || newCategory}".`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk move error", err);
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleBulkPin = async (pin: boolean) => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setIsBulkApplying(true);
    try {
      await bulkTogglePinTemplates(Array.from(selectedIds), pin);
      setSuccessToast(`${pin ? "Pinned" : "Unpinned"} ${count} templates.`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk pin error", err);
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setIsBulkApplying(true);
    try {
      await bulkDeleteTemplates(Array.from(selectedIds));
      setSuccessToast(`Deleted ${count} templates successfully.`);
      setSelectedIds(new Set());
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error("Bulk delete error", err);
    } finally {
      setIsBulkApplying(false);
    }
  };

  const openBulkEditModal = () => {
    setBulkCategory("keep");
    setBulkVersion("");
    setBulkTagsMode("append");
    setBulkTagsInput("");
    setBulkPinAction("keep");
    setIsBulkEditModalOpen(true);
  };

  const handleApplyBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    setIsBulkApplying(true);
    try {
      const updates: Partial<TemplateItem> = {};
      if (bulkCategory !== "keep") {
        const catObj = categories.find((c) => c.id === bulkCategory);
        updates.category = bulkCategory as TemplateCategory;
        updates.categoryLabel = catObj?.label || bulkCategory;
      }
      if (bulkVersion.trim()) {
        updates.version = bulkVersion.trim();
      }
      if (bulkPinAction === "pin") {
        updates.isPinned = true;
      } else if (bulkPinAction === "unpin") {
        updates.isPinned = false;
      }

      const tagsArray = bulkTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (bulkTagsMode === "replace" && tagsArray.length > 0) {
        updates.tags = tagsArray;
        await bulkUpdateTemplates(Array.from(selectedIds), updates);
      } else if (bulkTagsMode === "append" && tagsArray.length > 0) {
        await bulkUpdateTemplates(Array.from(selectedIds), updates, tagsArray);
      } else {
        await bulkUpdateTemplates(Array.from(selectedIds), updates);
      }

      setSuccessToast(`Updated ${selectedIds.size} templates.`);
      setSelectedIds(new Set());
      setIsBulkEditModalOpen(false);
    } catch (err) {
      console.error("Bulk update error", err);
    } finally {
      setIsBulkApplying(false);
    }
  };

  // Create New Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setNewCategoryError("Please enter a category name.");
      return;
    }

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!slug) {
      setNewCategoryError("Please enter a valid category name.");
      return;
    }

    if (categories.some((c) => c.id === slug || c.label.toLowerCase() === trimmed.toLowerCase())) {
      setNewCategoryError("A category with this name already exists.");
      return;
    }

    setIsCreatingCategory(true);
    setNewCategoryError(null);

    try {
      const preset = CATEGORY_COLOR_PRESETS[selectedColorPresetIndex] || CATEGORY_COLOR_PRESETS[0];
      const newCat: TemplateCategoryConfig = {
        id: slug,
        label: trimmed,
        badgeBg: preset.badgeBg,
        badgeText: preset.badgeText,
        borderColor: preset.borderColor,
        icon: "Folder",
        isCustom: true,
      };

      await saveCategory(newCat);
      setSuccessToast(`Category "${trimmed}" created successfully.`);
      setIsCreateCategoryModalOpen(false);
      setNewCategoryName("");
      setSelectedCategory(slug);
    } catch (err: any) {
      setNewCategoryError(err.message || "Failed to create category.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Open Upload / Edit Modal
  const openUploadModal = (template?: TemplateItem, defaultCategory?: TemplateCategory) => {
    const activeTabCategory: TemplateCategory =
      defaultCategory ||
      (selectedCategory !== "all" ? (selectedCategory as TemplateCategory) : "case_studies");

    if (template) {
      setEditingTemplate(template);
      setFormTitle(template.title);
      setFormCategory(template.category);
      setFormDescription(template.description);
      setFormTags(template.tags.join(", "));
      setFormVersion(template.version || "v1.0");
      setFormFileName(template.fileName);
      setFormFileSize(template.fileSize);
      setFormFileSizeBytes(template.fileSizeBytes);
      setFormFileType(template.fileType);
      setFormDownloadUrl(template.downloadUrl);
      setQueuedFiles([]);
    } else {
      setEditingTemplate(null);
      setFormTitle("");
      setFormCategory(activeTabCategory);
      setFormDescription("");
      const categoryObj = categories.find((c) => c.id === activeTabCategory);
      setFormTags(categoryObj ? `${categoryObj.label}, Enterprise` : "Template, Enterprise");
      setFormVersion("v1.0");
      setFormFileName("");
      setFormFileSize("");
      setFormFileSizeBytes(0);
      setFormFileType("doc");
      setFormDownloadUrl("");
      setQueuedFiles([]);
    }
    setFormError(null);
    setUploadProgress(null);
    setIsDragging(false);
    setIsUploadModalOpen(true);
  };

  // Helper for single file selection (editing mode)
  const handleSingleFileChange = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "doc";
    setFormFileName(file.name);
    setFormFileSize(formatBytes(file.size));
    setFormFileSizeBytes(file.size);
    setFormFileType(extension);
    if (!formTitle) {
      setFormTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim());
    }
    const objectUrl = URL.createObjectURL(file);
    setFormDownloadUrl(objectUrl);
  };

  // Add multiple files to queue
  const addFilesToQueue = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setQueuedFiles((prev) => {
      const existingSignatures = new Set(
        prev.map((f) => `${f.fileName}-${f.fileSizeBytes}`)
      );
      const newItems: QueuedTemplateFile[] = [];

      fileArray.forEach((file) => {
        const signature = `${file.name}-${file.size}`;
        if (!existingSignatures.has(signature)) {
          const extension = file.name.split(".").pop()?.toLowerCase() || "doc";
          const cleanTitle = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim();

          // Intelligent category deduction based on filename/title
          let detectedCategory: TemplateCategory = formCategory;
          const lowerName = file.name.toLowerCase();
          if (
            lowerName.includes("case study") ||
            lowerName.includes("case-study") ||
            lowerName.includes("case_study") ||
            lowerName.includes("casestudy")
          ) {
            detectedCategory = "case_studies";
          } else if (
            lowerName.includes("approach note") ||
            lowerName.includes("approach-note") ||
            lowerName.includes("approach_note") ||
            lowerName.includes("approachnote")
          ) {
            detectedCategory = "approach_notes";
          } else if (
            lowerName.includes("induction") ||
            lowerName.includes("brochure")
          ) {
            detectedCategory = "product_induction_materials";
          }

          newItems.push({
            id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file,
            fileName: file.name,
            title: cleanTitle,
            category: detectedCategory,
            fileSize: formatBytes(file.size),
            fileSizeBytes: file.size,
            fileType: extension,
          });
        }
      });

      return [...prev, ...newItems];
    });
    setFormError(null);
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateQueuedFile = (id: string, updates: Partial<QueuedTemplateFile>) => {
    setQueuedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const applyCategoryToAll = (category: TemplateCategory) => {
    setFormCategory(category);
    setQueuedFiles((prev) => prev.map((item) => ({ ...item, category })));
  };

  const clearQueue = () => {
    setQueuedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle File Input in Upload Modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (editingTemplate) {
      handleSingleFileChange(files[0]);
    } else {
      addFilesToQueue(files);
    }
    // reset input value so selecting the same file again triggers change
    e.target.value = "";
  };

  // Save Template Form Handler (Single Edit or Batch Multi-Upload)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTemplate) {
      if (!formTitle.trim()) {
        setFormError("Please enter a title for the template.");
        return;
      }

      setIsUploading(true);
      setFormError(null);

      try {
        const categoryObj = categories.find((c) => c.id === formCategory);
        const parsedTags = formTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const templateToSave: TemplateItem = {
          ...editingTemplate,
          title: formTitle.trim(),
          fileName: formFileName.trim() || editingTemplate.fileName,
          fileSize: formFileSize || editingTemplate.fileSize,
          fileSizeBytes: formFileSizeBytes || editingTemplate.fileSizeBytes,
          fileType: formFileType || editingTemplate.fileType,
          category: formCategory,
          categoryLabel: categoryObj?.label || editingTemplate.categoryLabel,
          description: formDescription.trim(),
          downloadUrl:
            formDownloadUrl ||
            editingTemplate.downloadUrl ||
            "/Template%20_%20Financial%20%20Proposal%20_%20Program%20Name%20@%20Client%20Name.doc",
          tags: parsedTags.length > 0 ? parsedTags : [categoryObj?.label || "Template"],
          version: formVersion.trim() || "v1.0",
        };

        await saveTemplate(templateToSave);
        setIsUploadModalOpen(false);
        setSuccessToast(`Template "${templateToSave.title}" updated successfully.`);
      } catch (err: any) {
        setFormError(err.message || "Failed to save template.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // MULTI-UPLOAD NEW TEMPLATES
    if (queuedFiles.length === 0) {
      setFormError("Please select or drop at least one template file to upload.");
      return;
    }

    const missingTitle = queuedFiles.find((f) => !f.title.trim());
    if (missingTitle) {
      setFormError(`Please provide a display title for "${missingTitle.fileName}".`);
      return;
    }

    setIsUploading(true);
    setFormError(null);

    try {
      const templatesToSave: TemplateItem[] = [];
      const parsedTags = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      for (let i = 0; i < queuedFiles.length; i++) {
        const qf = queuedFiles[i];
        setUploadProgress({
          current: i + 1,
          total: queuedFiles.length,
          currentFileName: qf.fileName,
        });

        let downloadUrl = "";
        try {
          const formData = new FormData();
          formData.append("file", qf.file);
          formData.append("uploadedBy", currentUser?.name || "Admin");

          const res = await fetch("/api/templates/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.downloadUrl) {
              downloadUrl = data.downloadUrl;
            }
          }
        } catch (uploadErr) {
          console.warn("Upload to storage route failed, falling back to local object URL:", uploadErr);
        }

        if (!downloadUrl) {
          downloadUrl = URL.createObjectURL(qf.file);
        }

        const categoryObj = categories.find((c) => c.id === qf.category);

        templatesToSave.push({
          id: `tpl-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          title: qf.title.trim(),
          fileName: qf.fileName,
          fileSize: qf.fileSize,
          fileSizeBytes: qf.fileSizeBytes,
          fileType: qf.fileType,
          category: qf.category,
          categoryLabel: categoryObj?.label || qf.category,
          description: formDescription.trim(),
          downloadUrl,
          uploadedBy: currentUser?.name || "Admin",
          uploadedByEmail: currentUser?.email || "sales@xmonks.com",
          uploadedAt: new Date().toISOString(),
          uploadedAtMs: Date.now() + i,
          tags: parsedTags.length > 0 ? parsedTags : [categoryObj?.label || "Template"],
          isPinned: false,
          downloadCount: 0,
          version: formVersion.trim() || "v1.0",
        });
      }

      await saveTemplatesBatch(templatesToSave);
      setIsUploadModalOpen(false);
      setQueuedFiles([]);
      setSuccessToast(
        `Successfully published ${templatesToSave.length} master template${
          templatesToSave.length > 1 ? "s" : ""
        } to the Master Repository!`
      );
    } catch (err: any) {
      setFormError(err.message || "Failed to publish templates.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Helper for file type badge style
  const getFileTypeBadge = (fileType: string) => {
    const ext = fileType.toLowerCase();
    if (ext === "doc" || ext === "docx") {
      return {
        label: "DOC",
        bg: "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        icon: FileText,
      };
    }
    if (ext === "pdf") {
      return {
        label: "PDF",
        bg: "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        icon: FileText,
      };
    }
    if (ext === "xls" || ext === "xlsx" || ext === "csv") {
      return {
        label: "XLS",
        bg: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        icon: FileSpreadsheet,
      };
    }
    return {
      label: ext.toUpperCase(),
      bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      icon: File,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-800/60 p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Centralized Master Repository</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                Visible to All Users
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Official Templates Hub</span>
              <span className="text-xl">📑</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standardized corporate proposal templates, financial frameworks, and commercial contracts.
              Uploaded and maintained by <strong className="text-white">Admin</strong>, accessible for instant download by every sales representative.
            </p>
          </div>

          {/* Admin Upload Action */}
          <div className="flex items-center space-x-3 shrink-0">
            {isUserAdmin ? (
              <button
                type="button"
                onClick={() => openUploadModal()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Master Template</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs text-slate-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All Templates Verified for Team Use</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Summary Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/60">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Templates
            </span>
            <span className="text-xl font-black text-white">{templates.length}</span>
            <span className="text-[10px] text-indigo-300 block">Master Library Assets</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
              Financial Proposals
            </span>
            <span className="text-xl font-black text-emerald-400">
              {categoryCounts["financial_proposals"] || 0}
            </span>
            <span className="text-[10px] text-emerald-300/80 block">Standardized Pricing Docs</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Downloads
            </span>
            <span className="text-xl font-black text-white">
              {templates.reduce((acc, t) => acc + (t.downloadCount || 0), 0)}
            </span>
            <span className="text-[10px] text-indigo-300 block">Used across client pitches</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Categories
            </span>
            <span className="text-xl font-black text-white">
              {categories.length}
            </span>
            <span className="text-[10px] text-indigo-300 block">Enterprise Asset Types</span>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
            selectedCategory === "all"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
              : "bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <span>All Templates</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 dark:bg-black/10">
            {categoryCounts["all"] || 0}
          </span>
        </button>

        {categories.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          const isSelected = selectedCategory === cat.id;

          return (
            <div key={cat.id} className="relative group/pill flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 border ${
                  isSelected
                    ? `${cat.badgeBg} ${cat.badgeText} ${cat.borderColor} ring-2 ring-emerald-500 shadow-sm`
                    : "bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-black/10 dark:bg-white/10" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>

              {/* If custom category, allow admin to delete it */}
              {isUserAdmin && cat.isCustom && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete custom category "${cat.label}"? Templates in this category will remain safe in the library.`)) {
                      await deleteCustomCategory(cat.id);
                      if (selectedCategory === cat.id) setSelectedCategory("all");
                      setSuccessToast(`Deleted category "${cat.label}".`);
                    }
                  }}
                  className="ml-1 p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover/pill:opacity-100 transition cursor-pointer"
                  title={`Delete category "${cat.label}"`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Create New Category Action */}
        {isUserAdmin && (
          <button
            type="button"
            onClick={() => {
              setNewCategoryName("");
              setSelectedColorPresetIndex(0);
              setNewCategoryError(null);
              setIsCreateCategoryModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-2 border-dashed border-emerald-300 dark:border-emerald-700 transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer shrink-0 active:scale-95 shadow-xs"
            title="Create new category"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        )}
      </div>

      {/* Search, Sort & View Mode Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by title, filename, tags, or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort, Multi-Select & View Mode Controls */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* Multi-Select Toggle */}
          {isUserAdmin && filteredTemplates.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  isAllVisibleSelected
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                    : selectedIds.size > 0
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}
              >
                {isAllVisibleSelected ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : isSomeVisibleSelected ? (
                  <MinusSquare className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} Selected`
                    : "Select All"}
                </span>
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer px-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400 font-bold text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="newest">Recently Uploaded</option>
              <option value="downloads">Most Downloaded</option>
              <option value="title">Title (A-Z)</option>
              <option value="size">File Size</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Template Listing */}
      {filteredTemplates.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
            📂
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Templates Found
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No templates match "${searchQuery}". Try a different keyword.`
              : "No templates have been uploaded in this category yet."}
          </p>
          {isUserAdmin && (
            <button
              type="button"
              onClick={() => openUploadModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
            >
              Upload Template Now
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const fileBadge = getFileTypeBadge(template.fileType);
            const FileIcon = fileBadge.icon;
            const catConfig = categories.find((c) => c.id === template.category);
            const isSelected = selectedIds.has(template.id);

            return (
              <div
                key={template.id}
                className={`group relative rounded-3xl bg-white dark:bg-slate-850 border-2 p-5 transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/10 dark:bg-emerald-950/20"
                    : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800"
                }`}
              >
                {/* Card Top: Badges & Actions */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {isUserAdmin && (
                        <button
                          type="button"
                          onClick={(e) => toggleSelectOne(template.id, e)}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            isSelected
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 ring-1 ring-emerald-500"
                              : "text-slate-300 dark:text-slate-600 hover:text-slate-500 opacity-60 hover:opacity-100 group-hover:opacity-100"
                          }`}
                          title={isSelected ? "Deselect template" : "Select template"}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${fileBadge.bg}`}
                      >
                        {fileBadge.label}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          catConfig
                            ? `${catConfig.badgeBg} ${catConfig.badgeText} ${catConfig.borderColor}`
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {template.categoryLabel}
                      </span>
                      {template.version && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {template.version}
                        </span>
                      )}
                    </div>

                    {/* Admin Pin & Edit Actions */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {isUserAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => togglePinTemplate(template.id)}
                            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                              template.isPinned
                                ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                                : "text-slate-300 hover:text-slate-600 dark:hover:text-slate-200"
                            }`}
                            title={template.isPinned ? "Unpin template" : "Pin to top"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openUploadModal(template)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Edit template details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
                                setTemplates((prev) => prev.filter((t) => t.id !== template.id));
                                await deleteTemplate(template.id);
                                setSuccessToast(`Deleted "${template.title}" successfully.`);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & File Info */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {template.title}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {template.fileName}
                    </p>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1 pt-1">
                      {template.tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                      {template.tags.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          +{template.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom: File Size, Download Count & Direct Download CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Size: {template.fileSize}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>{template.downloadCount || 0} downloads</span>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(template)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-sm hover:shadow flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Template</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(template)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      title={copiedId === template.id ? "Link copied!" : "Copy file link"}
                    >
                      {copiedId === template.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-3xl bg-white dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                  {isUserAdmin && (
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAllVisible}
                        className="text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                        title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}
                      >
                        {isAllVisibleSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : isSomeVisibleSelected ? (
                          <MinusSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="py-3 px-4">Template Title & File</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Type & Size</th>
                  <th className="py-3 px-3">Uploaded By</th>
                  <th className="py-3 px-3 text-center">Downloads</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTemplates.map((template) => {
                  const fileBadge = getFileTypeBadge(template.fileType);
                  const catConfig = categories.find((c) => c.id === template.category);
                  const isSelected = selectedIds.has(template.id);

                  return (
                    <tr
                      key={template.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-emerald-50/70 dark:bg-emerald-950/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {isUserAdmin && (
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleSelectOne(template.id, e)}
                            className="text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                            title={isSelected ? "Deselect template" : "Select template"}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        </td>
                      )}
                      {/* Title & File */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 border ${fileBadge.bg}`}
                          >
                            {fileBadge.label}
                          </span>
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 dark:text-white text-xs truncate">
                              {template.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {template.fileName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                            catConfig
                              ? `${catConfig.badgeBg} ${catConfig.badgeText} ${catConfig.borderColor}`
                              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {template.categoryLabel}
                        </span>
                      </td>

                      {/* Type & Size */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {template.fileSize}
                        </span>
                        {template.version && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({template.version})
                          </span>
                        )}
                      </td>

                      {/* Uploaded By */}
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {template.uploadedBy}
                      </td>

                      {/* Downloads */}
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {template.downloadCount || 0}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(template)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(template)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Copy Link"
                          >
                            {copiedId === template.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>

                          {isUserAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => openUploadModal(template)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
                                    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
                                    await deleteTemplate(template.id);
                                    setSuccessToast(`Deleted "${template.title}" successfully.`);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN UPLOAD / EDIT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {editingTemplate
                        ? "Edit Template Details"
                        : queuedFiles.length > 1
                        ? `Upload Master Templates (${queuedFiles.length} Selected)`
                        : "Upload New Master Template"}
                    </span>
                    {!editingTemplate && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Multi-Upload
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Uploaded templates are immediately visible and downloadable by all team members.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Upload Progress Bar (during upload) */}
              {isUploading && uploadProgress && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      <span>
                        Publishing {uploadProgress.current} of {uploadProgress.total} documents...
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                    </span>
                  </div>
                  {uploadProgress.currentFileName && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      File: {uploadProgress.currentFileName}
                    </div>
                  )}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* File Upload Zone */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {editingTemplate ? "Template Document" : "Select Template File(s)"}
                  </label>
                  {!editingTemplate && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Drag multiple files at once
                    </span>
                  )}
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      if (editingTemplate) {
                        handleSingleFileChange(e.dataTransfer.files[0]);
                      } else {
                        addFilesToQueue(e.dataTransfer.files);
                      }
                    }
                  }}
                  className={`p-4 border-2 border-dashed rounded-2xl transition-all text-center cursor-pointer group ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20"
                      : "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70"
                  }`}
                >
                  <UploadCloud
                    className={`w-8 h-8 mx-auto text-emerald-500 group-hover:scale-110 transition-transform mb-1.5 ${
                      isDragging ? "animate-bounce" : ""
                    }`}
                  />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {editingTemplate
                      ? formFileName || "Click or drag to replace document"
                      : queuedFiles.length > 0
                      ? "Click or drag to add more documents"
                      : "Click or drag to select document(s)"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Word (.doc, .docx), Excel (.xlsx), PDF up to 25MB • Multi-file batch upload enabled
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={!editingTemplate}
                    onChange={handleFileChange}
                    accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                  />
                </div>
              </div>

              {/* QUEUED FILES LIST (Multi-upload mode) */}
              {!editingTemplate && queuedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                        Queued Templates ({queuedFiles.length})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {formatBytes(queuedFiles.reduce((acc, f) => acc + f.fileSizeBytes, 0))} total
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add more</span>
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={clearQueue}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Scrollable List of Queued Files */}
                  <div className="max-h-56 overflow-y-auto space-y-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                    {queuedFiles.map((qf, index) => {
                      const fileBadge = getFileTypeBadge(qf.fileType);
                      return (
                        <div
                          key={qf.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                        >
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400 w-4">
                              #{index + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 border ${fileBadge.bg}`}
                            >
                              {fileBadge.label}
                            </span>
                          </div>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 w-full min-w-0">
                            {/* Title input */}
                            <div className="sm:col-span-7 min-w-0">
                              <input
                                type="text"
                                value={qf.title}
                                onChange={(e) =>
                                  updateQueuedFile(qf.id, { title: e.target.value })
                                }
                                placeholder="Template Title *"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                                {qf.fileName} • {qf.fileSize}
                              </div>
                            </div>

                            {/* Category selector */}
                            <div className="sm:col-span-5">
                              <select
                                value={qf.category}
                                onChange={(e) =>
                                  updateQueuedFile(qf.id, {
                                    category: e.target.value as TemplateCategory,
                                  })
                                }
                                className="w-full px-2 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              >
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeQueuedFile(qf.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0 self-center cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SINGLE EDIT MODE: Title & Category fields */}
              {editingTemplate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Template Display Title *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Executive Financial Proposal"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Category *
                      </label>
                      {isUserAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewCategoryName("");
                            setSelectedColorPresetIndex(0);
                            setNewCategoryError(null);
                            setIsCreateCategoryModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>New Category</span>
                        </button>
                      )}
                    </div>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as TemplateCategory)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* BATCH DEFAULTS / SHARED METADATA */}
              {!editingTemplate && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Batch Defaults & Metadata</span>
                    </span>
                    {queuedFiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => applyCategoryToAll(formCategory)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                      >
                        Apply category to all queued
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Default Category *
                        </label>
                        {isUserAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewCategoryName("");
                              setSelectedColorPresetIndex(0);
                              setNewCategoryError(null);
                              setIsCreateCategoryModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>New Category</span>
                          </button>
                        )}
                      </div>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          const cat = e.target.value as TemplateCategory;
                          applyCategoryToAll(cat);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Version
                      </label>
                      <input
                        type="text"
                        value={formVersion}
                        onChange={(e) => setFormVersion(e.target.value)}
                        placeholder="v1.0"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Search Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="Financial Proposals, Pricing, Commercials"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Version & Tags for single edit */}
              {editingTemplate && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Version
                    </label>
                    <input
                      type="text"
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      placeholder="v1.0"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Search Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="Financial Proposals, Pricing, Commercials"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Description / Commercial Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Usage Guide & Commercial Notes
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain when this template should be used, key commercial clauses, or guidelines for sales representatives..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">
                  {!editingTemplate && queuedFiles.length > 0 && (
                    <span>
                      Ready to upload <strong className="text-slate-800 dark:text-slate-200">{queuedFiles.length}</strong> template{queuedFiles.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || (!editingTemplate && queuedFiles.length === 0)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {uploadProgress
                            ? `Uploading (${uploadProgress.current}/${uploadProgress.total})...`
                            : "Saving..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {editingTemplate
                            ? "Update Template"
                            : queuedFiles.length > 1
                            ? `Publish ${queuedFiles.length} Templates`
                            : "Publish Template"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTIONS BAR */}
      {isUserAdmin && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 sm:space-x-4 animate-in slide-in-from-bottom-5 duration-200 max-w-[95vw] overflow-x-auto">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">
              selected
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700 shrink-0" />

          {/* Quick Category Move Dropdown */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
              Move to:
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleQuickBulkMoveCategory(e.target.value as TemplateCategory);
                  e.target.value = "";
                }
              }}
              disabled={isBulkApplying}
              defaultValue=""
              className="bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="" disabled>
                Change Category...
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Edit Button (Opens Modal) */}
          <button
            type="button"
            onClick={openBulkEditModal}
            disabled={isBulkApplying}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bulk Edit</span>
          </button>

          {/* Pin / Unpin Selected */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => handleBulkPin(true)}
              disabled={isBulkApplying}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer"
              title="Pin all selected to top"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delete Selected */}
          <button
            type="button"
            onClick={() => setIsBulkDeleteModalOpen(true)}
            disabled={isBulkApplying}
            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition cursor-pointer shrink-0"
            title="Delete selected templates"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-slate-700 shrink-0" />

          {/* Deselect All */}
          <button
            type="button"
            onClick={deselectAll}
            className="p-1 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BULK EDIT MODAL */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Bulk Edit ({selectedIds.size} Selected)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Apply category, version, and tag updates across all selected templates at once.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isBulkApplying && setIsBulkEditModalOpen(false)}
                disabled={isBulkApplying}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleApplyBulkEdit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Selected Items Preview */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Templates to Update ({selectedIds.size})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {templates
                    .filter((t) => selectedIds.has(t.id))
                    .map((t) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[220px]"
                        title={t.title}
                      >
                        {t.title}
                      </span>
                    ))}
                </div>
              </div>

              {/* Move Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold cursor-pointer"
                >
                  <option value="keep">Keep Existing Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      Move all to: {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Version & Pin Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Version
                  </label>
                  <input
                    type="text"
                    value={bulkVersion}
                    onChange={(e) => setBulkVersion(e.target.value)}
                    placeholder="Leave empty to keep current"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pin Status
                  </label>
                  <select
                    value={bulkPinAction}
                    onChange={(e) => setBulkPinAction(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold cursor-pointer"
                  >
                    <option value="keep">Keep Current Status</option>
                    <option value="pin">Pin All to Top</option>
                    <option value="unpin">Unpin All</option>
                  </select>
                </div>
              </div>

              {/* Search Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Search Tags
                  </label>
                  <div className="flex items-center space-x-2 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBulkTagsMode("append")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        bulkTagsMode === "append"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Append to existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkTagsMode("replace")}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        bulkTagsMode === "replace"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Replace all
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={bulkTagsInput}
                  onChange={(e) => setBulkTagsInput(e.target.value)}
                  placeholder="e.g. Enterprise, Q4 Pitch, Executive Coaching"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  disabled={isBulkApplying}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkApplying}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {isBulkApplying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to {selectedIds.size} Templates</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Delete {selectedIds.size} Selected Templates?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This action will permanently remove these {selectedIds.size} templates from the library for all team members.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-left max-h-32 overflow-y-auto space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              {templates
                .filter((t) => selectedIds.has(t.id))
                .map((t) => (
                  <div key={t.id} className="truncate">
                    • {t.title}
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkApplying}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkApplying}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                {isBulkApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete {selectedIds.size} Templates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY MODAL */}
      {isCreateCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Create New Category
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add a custom category to organize corporate templates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCategoryModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCategory} className="space-y-4">
              {newCategoryError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{newCategoryError}</span>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Playbooks, Compliance"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (newCategoryError) setNewCategoryError(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  autoFocus
                />
                {newCategoryName.trim() && (
                  <p className="text-[10px] text-slate-400">
                    Identifier: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "..."}</code>
                  </p>
                )}
              </div>

              {/* Color Theme Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Badge Color Style</span>
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_COLOR_PRESETS.map((preset, idx) => {
                    const isSelected = selectedColorPresetIndex === idx;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setSelectedColorPresetIndex(idx)}
                        className={`p-2 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-slate-50 dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${preset.dotBg}`} />
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                            {preset.name.split("/")[0].trim()}
                          </span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Live Preview
                </span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const preset = CATEGORY_COLOR_PRESETS[selectedColorPresetIndex] || CATEGORY_COLOR_PRESETS[0];
                    return (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border ${preset.badgeBg} ${preset.badgeText} ${preset.borderColor}`}
                      >
                        {newCategoryName.trim() || "Preview Label"}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryModalOpen(false)}
                  disabled={isCreatingCategory}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isCreatingCategory ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


