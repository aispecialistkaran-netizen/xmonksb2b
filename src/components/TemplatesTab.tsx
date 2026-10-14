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
} from "lucide-react";
import {
  TemplateItem,
  TemplateCategory,
  TEMPLATE_CATEGORIES,
} from "@/types/template";
import {
  subscribeToTemplates,
  saveTemplate,
  deleteTemplate,
  recordTemplateDownload,
  togglePinTemplate,
  INITIAL_TEMPLATES,
} from "@/lib/templatesService";
import { UserAccount } from "@/constants/users";
import { formatBytes } from "@/lib/formatters";

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

  // Form State
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time synchronization
  useEffect(() => {
    const unsub = subscribeToTemplates((data) => {
      setTemplates(data);
    });
    return () => unsub();
  }, []);

  const isUserAdmin =
    isAdmin ||
    currentUser?.username?.toLowerCase() === "admin" ||
    currentUser?.role?.toLowerCase().includes("admin");

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    TEMPLATE_CATEGORIES.forEach((c) => {
      counts[c.id] = templates.filter((t) => t.category === c.id).length;
    });
    return counts;
  }, [templates]);

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

  // Open Upload / Edit Modal
  const openUploadModal = (template?: TemplateItem) => {
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
    } else {
      setEditingTemplate(null);
      setFormTitle("");
      setFormCategory("financial_proposals");
      setFormDescription("");
      setFormTags("Financial Proposals, Enterprise");
      setFormVersion("v1.0");
      setFormFileName("");
      setFormFileSize("");
      setFormFileSizeBytes(0);
      setFormFileType("doc");
      setFormDownloadUrl("");
    }
    setFormError(null);
    setIsUploadModalOpen(true);
  };

  // Handle File Input in Upload Modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() || "doc";
    setFormFileName(file.name);
    setFormFileSize(formatBytes(file.size));
    setFormFileSizeBytes(file.size);
    setFormFileType(extension);
    if (!formTitle) {
      // Auto-populate friendly title from file name
      setFormTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").trim());
    }

    // Create local object URL for preview/download
    const objectUrl = URL.createObjectURL(file);
    setFormDownloadUrl(objectUrl);
  };

  // Save Template Form Handler
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Please enter a title for the template.");
      return;
    }
    if (!formFileName.trim() && !editingTemplate) {
      setFormError("Please select a template file to upload.");
      return;
    }

    setIsUploading(true);
    setFormError(null);

    try {
      const categoryObj = TEMPLATE_CATEGORIES.find((c) => c.id === formCategory);
      const parsedTags = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const templateToSave: TemplateItem = {
        id: editingTemplate ? editingTemplate.id : `tpl-${Date.now()}`,
        title: formTitle.trim(),
        fileName: formFileName.trim() || "template_document.doc",
        fileSize: formFileSize || "500 KB",
        fileSizeBytes: formFileSizeBytes || 512000,
        fileType: formFileType || "doc",
        category: formCategory,
        categoryLabel: categoryObj?.label || "Financial Proposals",
        description: formDescription.trim(),
        downloadUrl:
          formDownloadUrl ||
          editingTemplate?.downloadUrl ||
          "/Template%20_%20Financial%20%20Proposal%20_%20Program%20Name%20@%20Client%20Name.doc",
        uploadedBy: currentUser?.name || "Admin",
        uploadedByEmail: currentUser?.email || "sales@xmonks.com",
        uploadedAt: editingTemplate?.uploadedAt || new Date().toISOString(),
        uploadedAtMs: editingTemplate?.uploadedAtMs || Date.now(),
        tags: parsedTags.length > 0 ? parsedTags : [categoryObj?.label || "Template"],
        isPinned: editingTemplate?.isPinned || false,
        downloadCount: editingTemplate?.downloadCount || 0,
        version: formVersion.trim() || "v1.0",
      };

      await saveTemplate(templateToSave);
      setIsUploadModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save template.");
    } finally {
      setIsUploading(false);
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
              {TEMPLATE_CATEGORIES.length}
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

        {TEMPLATE_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
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
          );
        })}
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

        {/* Sort & View Mode Controls */}
        <div className="flex items-center space-x-2 shrink-0">
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

            return (
              <div
                key={template.id}
                className="group relative rounded-3xl bg-white dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Badges & Actions */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${fileBadge.bg}`}
                      >
                        {fileBadge.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                                await deleteTemplate(template.id);
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

                  return (
                    <tr
                      key={template.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
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
                                  if (confirm(`Delete "${template.title}"?`)) {
                                    await deleteTemplate(template.id);
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
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingTemplate ? "Edit Template Details" : "Upload New Master Template"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Uploaded templates are immediately visible and downloadable by all team members.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* File Upload Zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Template File (.doc, .docx, .pdf, .xlsx)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 transition-all text-center cursor-pointer group"
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-emerald-500 group-hover:scale-110 transition-transform mb-1.5" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formFileName ? formFileName : "Click or drag to select document"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formFileSize ? `Size: ${formFileSize} • Type: ${formFileType.toUpperCase()}` : "Word (.doc, .docx), Excel (.xlsx), PDF up to 25MB"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Title & Category Grid */}
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TemplateCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold cursor-pointer"
                  >
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Version & Tags */}
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

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Usage Guide & Commercial Notes
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain when this financial proposal should be used, key commercial clauses, or guidelines for sales representatives..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingTemplate ? "Update Template" : "Publish Template"}</span>
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
