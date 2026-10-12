"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  PackageCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  SlidersHorizontal,
  FileText,
  Building2,
  Percent,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  Users,
  ShieldCheck,
  Check,
  ChevronDown,
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { UserAccount } from "@/constants/users";
import { Lead } from "@/types/lead";
import {
  DeliveryRecord,
  DeliveryMilestoneTranche,
  PaymentTermTranche,
  TenureType,
  DeliveryOverallStatus,
  MilestoneCompletionStatus,
  TranchePaymentStatus,
} from "@/types/delivery";
import { SpringButton, SpringWidget, SpringCounter } from "@/components/spring";
import {
  subscribeToDeliveryRecords,
  createDeliveryRecordFromLead,
  updateDeliveryRecord,
  deleteDeliveryRecord,
  createDefaultDeliveryMilestones,
  createDefaultPaymentTerms,
} from "@/lib/deliveryService";
import confetti from "canvas-confetti";

interface DeliveryTabProps {
  leads: Lead[];
  allLeads: Lead[];
  currentUser?: UserAccount | null;
  isAdmin: boolean;
}

export const DeliveryTab: React.FC<DeliveryTabProps> = ({
  leads,
  allLeads,
  currentUser,
  isAdmin,
}) => {
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenureFilter, setSelectedTenureFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  // Modals & Drawers
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<DeliveryRecord | null>(null);
  const [newProjectForm, setNewProjectForm] = useState({
    companyName: "",
    dealValue: 1500000,
    program: "Executive Coaching",
    clientPartner: currentUser?.name || "Sales Lead",
    deliveryLead: "Delivery Team",
    tenureType: "delivery" as TenureType,
  });

  // Subscribe to real-time Delivery records
  useEffect(() => {
    const unsubscribe = subscribeToDeliveryRecords((records, syncing) => {
      setDeliveryRecords(records);
      setIsSyncing(syncing);
    });
    return () => unsubscribe();
  }, []);

  // Filter won closure leads from pipeline that can be imported to Delivery
  const closureLeads = useMemo(() => {
    return allLeads.filter((l) => l.stage === "closure");
  }, [allLeads]);

  // Record currently selected for viewing/editing
  const selectedRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return deliveryRecords.find((r) => r.id === selectedRecordId) || null;
  }, [deliveryRecords, selectedRecordId]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    let totalPortfolio = 0;
    let totalReceived = 0;
    let activeCount = 0;
    let deliveredCount = 0;

    deliveryRecords.forEach((r) => {
      totalPortfolio += r.dealValue || 0;
      if (r.deliveryStatus === "in_progress" || r.deliveryStatus === "not_started") {
        activeCount++;
      } else if (r.deliveryStatus === "delivered") {
        deliveredCount++;
      }

      // Calculate received based on tenure type
      if (r.tenureType === "delivery") {
        r.deliveryMilestones.forEach((m) => {
          if (m.paymentStatus === "received") {
            totalReceived += m.amount || 0;
          }
        });
      } else {
        r.paymentTerms.forEach((t) => {
          if (t.paymentStatus === "received") {
            totalReceived += t.amount || 0;
          }
        });
      }
    });

    const pendingPayment = Math.max(0, totalPortfolio - totalReceived);
    const collectionRate = totalPortfolio > 0 ? (totalReceived / totalPortfolio) * 100 : 0;

    return {
      totalPortfolio,
      totalReceived,
      pendingPayment,
      activeCount,
      deliveredCount,
      collectionRate,
      totalProjects: deliveryRecords.length,
    };
  }, [deliveryRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return deliveryRecords.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.clientPartner && r.clientPartner.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.program && r.program.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.contactName && r.contactName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTenure =
        selectedTenureFilter === "all" || r.tenureType === selectedTenureFilter;

      const matchesStatus =
        selectedStatusFilter === "all" || r.deliveryStatus === selectedStatusFilter;

      return matchesSearch && matchesTenure && matchesStatus;
    });
  }, [deliveryRecords, searchQuery, selectedTenureFilter, selectedStatusFilter]);

  // Handlers
  const handleSelectRecord = (id: string) => {
    setSelectedRecordId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImportLead = async (lead: Lead, tenure: TenureType) => {
    try {
      const created = await createDeliveryRecordFromLead(lead, tenure, currentUser?.name || "Delivery Lead");
      setIsImportModalOpen(false);
      setSelectedRecordId(created.id);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (e) {
      console.error("Error importing lead to delivery", e);
    }
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.companyName.trim()) return;

    const mockLead: Partial<Lead> = {
      id: `custom-proj-${Date.now()}`,
      companyName: newProjectForm.companyName.trim(),
      dealValue: Number(newProjectForm.dealValue) || 1000000,
      program: newProjectForm.program,
      owner: newProjectForm.clientPartner,
      stage: "closure",
      contactName: "Lead Stakeholder",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await createDeliveryRecordFromLead(
      mockLead as Lead,
      newProjectForm.tenureType,
      newProjectForm.deliveryLead
    );

    setIsNewProjectModalOpen(false);
    setSelectedRecordId(created.id);
    setNewProjectForm({
      companyName: "",
      dealValue: 1500000,
      program: "Executive Coaching",
      clientPartner: currentUser?.name || "Sales Lead",
      deliveryLead: "Delivery Team",
      tenureType: "delivery",
    });
  };

  const handleUpdateTenureType = async (newType: TenureType) => {
    if (!selectedRecord) return;
    await updateDeliveryRecord(
      selectedRecord.id,
      { tenureType: newType },
      currentUser?.name || "User"
    );
  };

  const handleUpdateDeliveryStatus = async (status: DeliveryOverallStatus) => {
    if (!selectedRecord) return;
    const updates: Partial<DeliveryRecord> = { deliveryStatus: status };
    if (status === "delivered") {
      updates.overallCompletionPercent = 100;
    }
    await updateDeliveryRecord(selectedRecord.id, updates, currentUser?.name || "User");
  };

  const handleUpdateCompletionPercent = async (percent: number) => {
    if (!selectedRecord) return;
    const clamped = Math.max(0, Math.min(100, percent));
    const updates: Partial<DeliveryRecord> = { overallCompletionPercent: clamped };
    if (clamped === 100 && selectedRecord.deliveryStatus !== "delivered") {
      updates.deliveryStatus = "delivered";
    } else if (clamped > 0 && selectedRecord.deliveryStatus === "not_started") {
      updates.deliveryStatus = "in_progress";
    }
    await updateDeliveryRecord(selectedRecord.id, updates, currentUser?.name || "User");
  };

  // Milestone actions for "Delivery" option
  const handleUpdateMilestone = async (
    milestoneId: string,
    updates: Partial<DeliveryMilestoneTranche>
  ) => {
    if (!selectedRecord) return;
    const currentList = [...selectedRecord.deliveryMilestones];
    const idx = currentList.findIndex((m) => m.id === milestoneId);
    if (idx === -1) return;

    const updatedMilestone = { ...currentList[idx], ...updates };

    // If payment percent changed, recompute amount
    if (updates.paymentPercent !== undefined) {
      updatedMilestone.amount = Math.round(
        selectedRecord.dealValue * (updatedMilestone.paymentPercent / 100)
      );
    }

    currentList[idx] = updatedMilestone;

    // Auto-update overall completion if milestones are completed
    let completedPercent = 0;
    currentList.forEach((m) => {
      if (m.milestoneStatus === "completed") {
        completedPercent = Math.max(completedPercent, m.projectCompletionPercent);
      }
    });

    await updateDeliveryRecord(
      selectedRecord.id,
      {
        deliveryMilestones: currentList,
        overallCompletionPercent: Math.max(
          selectedRecord.overallCompletionPercent,
          completedPercent
        ),
      },
      currentUser?.name || "User"
    );
  };

  const handleAddMilestone = async () => {
    if (!selectedRecord) return;
    const currentList = [...selectedRecord.deliveryMilestones];
    const newMilestone: DeliveryMilestoneTranche = {
      id: `milestone-${Date.now()}`,
      milestoneTitle: `Milestone ${currentList.length + 1}`,
      projectCompletionPercent: Math.min(100, (currentList.length + 1) * 25),
      paymentPercent: 20,
      amount: Math.round(selectedRecord.dealValue * 0.2),
      milestoneStatus: "pending",
      paymentStatus: "pending",
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      notes: "",
    };

    await updateDeliveryRecord(
      selectedRecord.id,
      { deliveryMilestones: [...currentList, newMilestone] },
      currentUser?.name || "User"
    );
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!selectedRecord) return;
    const filtered = selectedRecord.deliveryMilestones.filter((m) => m.id !== milestoneId);
    await updateDeliveryRecord(
      selectedRecord.id,
      { deliveryMilestones: filtered },
      currentUser?.name || "User"
    );
  };

  // Payment Term actions for "Payment Terms" option
  const handleUpdatePaymentTerm = async (
    termId: string,
    updates: Partial<PaymentTermTranche>
  ) => {
    if (!selectedRecord) return;
    const currentList = [...selectedRecord.paymentTerms];
    const idx = currentList.findIndex((t) => t.id === termId);
    if (idx === -1) return;

    const updatedTerm = { ...currentList[idx], ...updates };

    // If payment percent changed, recompute amount
    if (updates.paymentPercent !== undefined) {
      updatedTerm.amount = Math.round(
        selectedRecord.dealValue * (updatedTerm.paymentPercent / 100)
      );
    }

    currentList[idx] = updatedTerm;

    await updateDeliveryRecord(
      selectedRecord.id,
      { paymentTerms: currentList },
      currentUser?.name || "User"
    );
  };

  const handleAddPaymentTerm = async () => {
    if (!selectedRecord) return;
    const currentList = [...selectedRecord.paymentTerms];
    const newTerm: PaymentTermTranche = {
      id: `term-${Date.now()}`,
      termLabel: `Installment ${currentList.length}`,
      isAdvance: false,
      timeframe: `After ${(currentList.length) * 3} Months`,
      paymentPercent: 20,
      amount: Math.round(selectedRecord.dealValue * 0.2),
      dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
      paymentStatus: "pending",
      notes: "",
    };

    await updateDeliveryRecord(
      selectedRecord.id,
      { paymentTerms: [...currentList, newTerm] },
      currentUser?.name || "User"
    );
  };

  const handleDeletePaymentTerm = async (termId: string) => {
    if (!selectedRecord) return;
    const filtered = selectedRecord.paymentTerms.filter((t) => t.id !== termId);
    await updateDeliveryRecord(
      selectedRecord.id,
      { paymentTerms: filtered },
      currentUser?.name || "User"
    );
  };

  const handleRequestDelete = (record: DeliveryRecord) => {
    setProjectToDelete(record);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    const targetId = projectToDelete.id;

    // Immediately update local state for instantaneous feedback
    setDeliveryRecords((prev) => prev.filter((r) => r.id !== targetId));
    if (selectedRecordId === targetId) {
      setSelectedRecordId(null);
    }
    setProjectToDelete(null);

    // Persist to storage & Firestore
    await deleteDeliveryRecord(targetId);
  };

  // Compute selected project's milestone / tenure summaries
  const selectedRecordStats = useMemo(() => {
    if (!selectedRecord) return null;

    let totalAllocatedPercent = 0;
    let totalAllocatedAmount = 0;
    let totalReceivedAmount = 0;
    let completedMilestonesCount = 0;

    if (selectedRecord.tenureType === "delivery") {
      selectedRecord.deliveryMilestones.forEach((m) => {
        totalAllocatedPercent += m.paymentPercent || 0;
        totalAllocatedAmount += m.amount || 0;
        if (m.paymentStatus === "received") {
          totalReceivedAmount += m.amount || 0;
        }
        if (m.milestoneStatus === "completed") {
          completedMilestonesCount++;
        }
      });
    } else {
      selectedRecord.paymentTerms.forEach((t) => {
        totalAllocatedPercent += t.paymentPercent || 0;
        totalAllocatedAmount += t.amount || 0;
        if (t.paymentStatus === "received") {
          totalReceivedAmount += t.amount || 0;
        }
      });
    }

    const pendingAmount = Math.max(0, selectedRecord.dealValue - totalReceivedAmount);
    const percentReceived =
      selectedRecord.dealValue > 0
        ? Math.round((totalReceivedAmount / selectedRecord.dealValue) * 100)
        : 0;

    return {
      totalAllocatedPercent,
      totalAllocatedAmount,
      totalReceivedAmount,
      pendingAmount,
      percentReceived,
      completedMilestonesCount,
    };
  }, [selectedRecord]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                  <span>Delivery & Execution Hub</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Live Pipeline
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Manage won closure projects, project completion-linked payout milestones, and schedule-based payment terms.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <SpringButton
              variant="gradient"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2 shadow-md shadow-indigo-500/20"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Import Won Deal from Closure</span>
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">
                {closureLeads.length} Available
              </span>
            </SpringButton>

            <SpringButton
              variant="secondary"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </SpringButton>
          </div>
        </div>

        {/* Global Delivery Stats KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <SpringWidget
            delay={0}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800"
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Delivery Portfolio
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              <SpringCounter value={metrics.totalPortfolio} isCurrency />
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {metrics.totalProjects} tracked project{metrics.totalProjects !== 1 ? "s" : ""}
            </div>
          </SpringWidget>

          <SpringWidget
            delay={70}
            className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50"
          >
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Realized Payments
            </span>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1">
              <SpringCounter value={metrics.totalReceived} isCurrency />
            </div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span><SpringCounter value={metrics.collectionRate} decimals={1} suffix="% collected" /></span>
            </div>
          </SpringWidget>

          <SpringWidget
            delay={140}
            className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50"
          >
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Pending Receivable
            </span>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-1">
              <SpringCounter value={metrics.pendingPayment} isCurrency />
            </div>
            <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              Linked to milestones & terms
            </div>
          </SpringWidget>

          <SpringWidget
            delay={210}
            className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/50"
          >
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              Delivery Execution
            </span>
            <div className="text-lg font-black text-blue-700 dark:text-blue-300 mt-1 flex items-center space-x-1.5">
              <span>{metrics.activeCount} In Progress</span>
            </div>
            <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
              {metrics.deliveredCount} successfully delivered
            </div>
          </SpringWidget>
        </div>
      </div>

      {/* DETAILED PROJECT DELIVERY & TENURE MANAGER (When a project is selected) */}
      {selectedRecord && (
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/40 dark:border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-6 relative">
          {/* Top banner of selected project */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedRecordId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
                  title="Close project view"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md">
                  Active Delivery Management
                </span>
                <span className="text-xs text-slate-400">• ID: {selectedRecord.id}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                <span>{selectedRecord.companyName}</span>
                <span className="text-sm font-bold text-slate-400">({selectedRecord.program})</span>
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Owner: <strong className="text-slate-700 dark:text-slate-200">{selectedRecord.clientPartner}</strong></span>
                <span>Delivery Lead: <strong className="text-slate-700 dark:text-slate-200">{selectedRecord.deliveryLead || "Unassigned"}</strong></span>
                <span>Value: <strong className="text-indigo-600 dark:text-indigo-400">{formatINR(selectedRecord.dealValue)}</strong></span>
              </div>
            </div>

            {/* Delivery Status & Progress Controls */}
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Delivery Status
                </label>
                <select
                  value={selectedRecord.deliveryStatus}
                  onChange={(e) => handleUpdateDeliveryStatus(e.target.value as DeliveryOverallStatus)}
                  className="mt-1 text-xs font-black rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="not_started">⚪ Not Started</option>
                  <option value="in_progress">🔵 In Progress</option>
                  <option value="delivered">🟢 Delivered (Done)</option>
                  <option value="on_hold">🟡 On Hold</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Project Completion
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedRecord.overallCompletionPercent}
                    onChange={(e) => handleUpdateCompletionPercent(Number(e.target.value))}
                    className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 w-10 text-right">
                    {selectedRecord.overallCompletionPercent}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRequestDelete(selectedRecord)}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition ml-2 cursor-pointer"
                title="Delete this delivery project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Progress Summary Bar */}
          {selectedRecordStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-800/40 dark:via-indigo-950/20 dark:to-slate-800/40 rounded-xl border border-indigo-200/50 dark:border-indigo-900/50">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  <span>Project Work Completion</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">
                    {selectedRecord.overallCompletionPercent}% Completed
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedRecord.overallCompletionPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  <span>Payment Realized</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    {selectedRecordStats.percentReceived}% ({formatINR(selectedRecordStats.totalReceivedAmount)})
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedRecordStats.percentReceived}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  <span>Pending Payment Due</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black">
                    {formatINR(selectedRecordStats.pendingAmount)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total Contract Value: <strong>{formatINR(selectedRecord.dealValue)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* THE CORE TENURE HEADING & SELECTION ENGINE */}
          {/* ========================================================= */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Tenure
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select how project payments and tranches are structured for this client.
                  </p>
                </div>
              </div>
            </div>

            {/* The Two Main Options: 1. Delivery  vs  2. Payment Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Delivery */}
              <div
                onClick={() => handleUpdateTenureType("delivery")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  selectedRecord.tenureType === "delivery"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        selectedRecord.tenureType === "delivery"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        Delivery
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Project Completion Linked
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedRecord.tenureType === "delivery"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {selectedRecord.tenureType === "delivery" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                  Payment comes in milestones tied directly to delivery progress. E.g., when <strong>20% of the project</strong> is completed then <strong>30% payment</strong> is released, similar to progress completion.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Tranches configured:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">
                    {selectedRecord.deliveryMilestones.length} Milestones
                  </span>
                </div>
              </div>

              {/* Option 2: Payment Terms */}
              <div
                onClick={() => handleUpdateTenureType("payment_terms")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  selectedRecord.tenureType === "payment_terms"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        selectedRecord.tenureType === "payment_terms"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        Payment Terms
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Advance & Time Schedule
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedRecord.tenureType === "payment_terms"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {selectedRecord.tenureType === "payment_terms" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                  Payment comes in scheduled time intervals. E.g., <strong>30% advance payment upfront</strong>, then <strong>20% after 3 months</strong>, and remaining terms according to agreement.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Terms configured:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">
                    {selectedRecord.paymentTerms.length} Installments
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* SUB-SECTION A: When "Delivery" Tenure Option is Active */}
            {/* ========================================================= */}
            {selectedRecord.tenureType === "delivery" && (
              <div className="mt-6 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span>Project Completion Milestone Tranches</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Configure the project completion target and corresponding payment release for each milestone.
                    </p>
                  </div>
                  <SpringButton
                    size="sm"
                    variant="primary"
                    onClick={handleAddMilestone}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </SpringButton>
                </div>

                {/* Milestones Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Milestone Scope / Title</th>
                        <th className="py-2.5 px-3">Project Completion (%)</th>
                        <th className="py-2.5 px-3">Payment Release (%)</th>
                        <th className="py-2.5 px-3">Amount (INR)</th>
                        <th className="py-2.5 px-3">Target Date</th>
                        <th className="py-2.5 px-3">Work Status</th>
                        <th className="py-2.5 px-3">Payment Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {selectedRecord.deliveryMilestones.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 min-w-[200px]">
                            <input
                              type="text"
                              value={m.milestoneTitle}
                              onChange={(e) =>
                                handleUpdateMilestone(m.id, { milestoneTitle: e.target.value })
                              }
                              className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                              placeholder="e.g. 20% Project Kickoff"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={m.projectCompletionPercent}
                                onChange={(e) =>
                                  handleUpdateMilestone(m.id, {
                                    projectCompletionPercent: Number(e.target.value),
                                  })
                                }
                                className="w-16 px-2 py-1 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400"
                              />
                              <span className="font-bold text-slate-400">%</span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={m.paymentPercent}
                                onChange={(e) =>
                                  handleUpdateMilestone(m.id, {
                                    paymentPercent: Number(e.target.value),
                                  })
                                }
                                className="w-16 px-2 py-1 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400"
                              />
                              <span className="font-bold text-slate-400">%</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-black text-slate-900 dark:text-white whitespace-nowrap">
                            {formatINR(m.amount)}
                          </td>

                          <td className="py-3 px-3">
                            <input
                              type="date"
                              value={m.targetDate || ""}
                              onChange={(e) =>
                                handleUpdateMilestone(m.id, { targetDate: e.target.value })
                              }
                              className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <select
                              value={m.milestoneStatus}
                              onChange={(e) =>
                                handleUpdateMilestone(m.id, {
                                  milestoneStatus: e.target.value as MilestoneCompletionStatus,
                                })
                              }
                              className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                                m.milestoneStatus === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                  : m.milestoneStatus === "in_progress"
                                  ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-slate-50 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              }`}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="in_progress">⚙️ In Progress</option>
                              <option value="completed">✅ Completed</option>
                            </select>
                          </td>

                          <td className="py-3 px-3">
                            <select
                              value={m.paymentStatus}
                              onChange={(e) =>
                                handleUpdateMilestone(m.id, {
                                  paymentStatus: e.target.value as TranchePaymentStatus,
                                })
                              }
                              className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                                m.paymentStatus === "received"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                  : m.paymentStatus === "invoiced"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                                  : m.paymentStatus === "overdue"
                                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                                  : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                              }`}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="invoiced">📄 Invoiced</option>
                              <option value="received">💰 Received</option>
                              <option value="overdue">⚠️ Overdue</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                              title="Delete milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Milestone allocation summary footer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Total Payment Tranches Allocated:</span>
                    <strong
                      className={`font-black ${
                        selectedRecordStats?.totalAllocatedPercent === 100
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {selectedRecordStats?.totalAllocatedPercent}%
                    </strong>
                    {selectedRecordStats?.totalAllocatedPercent !== 100 && (
                      <span className="text-[11px] text-amber-500">
                        (Should total 100% of deal value)
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">
                    Allocated: <strong>{formatINR(selectedRecordStats?.totalAllocatedAmount || 0)}</strong> / Total: <strong>{formatINR(selectedRecord.dealValue)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SUB-SECTION B: When "Payment Terms" Option is Active */}
            {/* ========================================================= */}
            {selectedRecord.tenureType === "payment_terms" && (
              <div className="mt-6 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Advance & Scheduled Payment Terms</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Configure advance payment upfront (e.g. 30%) followed by time-based installments (e.g. 20% after 3 months).
                    </p>
                  </div>
                  <SpringButton
                    size="sm"
                    variant="primary"
                    onClick={handleAddPaymentTerm}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Installment Term</span>
                  </SpringButton>
                </div>

                {/* Terms Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Term / Installment Label</th>
                        <th className="py-2.5 px-3">Timeframe / Schedule</th>
                        <th className="py-2.5 px-3">Payment (%)</th>
                        <th className="py-2.5 px-3">Amount (INR)</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Payment Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {selectedRecord.paymentTerms.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 min-w-[180px]">
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={t.termLabel}
                                onChange={(e) =>
                                  handleUpdatePaymentTerm(t.id, { termLabel: e.target.value })
                                }
                                className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                placeholder="e.g. Advance Payment"
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 min-w-[180px]">
                            <select
                              value={t.timeframe}
                              onChange={(e) =>
                                handleUpdatePaymentTerm(t.id, { timeframe: e.target.value })
                              }
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
                            >
                              <option value="Advance (Immediate on Contract)">Advance (Immediate on Contract)</option>
                              <option value="After 1 Month">After 1 Month</option>
                              <option value="After 2 Months">After 2 Months</option>
                              <option value="After 3 Months">After 3 Months</option>
                              <option value="After 4 Months">After 4 Months</option>
                              <option value="After 6 Months">After 6 Months</option>
                              <option value="After 9 Months">After 9 Months</option>
                              <option value="After 12 Months">After 12 Months</option>
                              <option value="On Completion / Sign-off">On Completion / Sign-off</option>
                              <option value="Custom Schedule">Custom Schedule</option>
                            </select>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={t.paymentPercent}
                                onChange={(e) =>
                                  handleUpdatePaymentTerm(t.id, {
                                    paymentPercent: Number(e.target.value),
                                  })
                                }
                                className="w-16 px-2 py-1 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400"
                              />
                              <span className="font-bold text-slate-400">%</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-black text-slate-900 dark:text-white whitespace-nowrap">
                            {formatINR(t.amount)}
                          </td>

                          <td className="py-3 px-3">
                            <input
                              type="date"
                              value={t.dueDate || ""}
                              onChange={(e) =>
                                handleUpdatePaymentTerm(t.id, { dueDate: e.target.value })
                              }
                              className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <select
                              value={t.paymentStatus}
                              onChange={(e) =>
                                handleUpdatePaymentTerm(t.id, {
                                  paymentStatus: e.target.value as TranchePaymentStatus,
                                })
                              }
                              className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                                t.paymentStatus === "received"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                  : t.paymentStatus === "invoiced"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                                  : t.paymentStatus === "overdue"
                                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                                  : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                              }`}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="invoiced">📄 Invoiced</option>
                              <option value="received">💰 Received</option>
                              <option value="overdue">⚠️ Overdue</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeletePaymentTerm(t.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                              title="Delete term"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Terms allocation summary footer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Total Terms Allocated:</span>
                    <strong
                      className={`font-black ${
                        selectedRecordStats?.totalAllocatedPercent === 100
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {selectedRecordStats?.totalAllocatedPercent}%
                    </strong>
                    {selectedRecordStats?.totalAllocatedPercent !== 100 && (
                      <span className="text-[11px] text-amber-500">
                        (Should total 100% of deal value)
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">
                    Allocated: <strong>{formatINR(selectedRecordStats?.totalAllocatedAmount || 0)}</strong> / Total: <strong>{formatINR(selectedRecord.dealValue)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ALL PROJECTS IN DELIVERY PIPELINE TABLE / CARDS */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <span>All Delivery Projects</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                {filteredRecords.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any project to configure or manage its Tenure model and completion milestones.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, owner..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <select
              value={selectedTenureFilter}
              onChange={(e) => setSelectedTenureFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Tenure Models</option>
              <option value="delivery">Delivery (% Completion)</option>
              <option value="payment_terms">Payment Terms (Schedule)</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="delivered">Delivered</option>
              <option value="not_started">Not Started</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No delivery projects found
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Import a won deal from the Closure stage in your pipeline or create a new delivery project to get started.
            </p>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
            >
              Import from Closure
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Company & Program</th>
                  <th className="py-3 px-4">Client Partner</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Tenure Model</th>
                  <th className="py-3 px-4">Project Completion</th>
                  <th className="py-3 px-4">Payment Realized</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRecords.map((r) => {
                  let receivedAmt = 0;
                  if (r.tenureType === "delivery") {
                    r.deliveryMilestones.forEach((m) => {
                      if (m.paymentStatus === "received") receivedAmt += m.amount;
                    });
                  } else {
                    r.paymentTerms.forEach((t) => {
                      if (t.paymentStatus === "received") receivedAmt += t.amount;
                    });
                  }
                  const percentReceived =
                    r.dealValue > 0 ? Math.round((receivedAmt / r.dealValue) * 100) : 0;

                  const isSelected = selectedRecordId === r.id;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleSelectRecord(r.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition ${
                        isSelected ? "bg-indigo-50/60 dark:bg-indigo-950/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {r.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {r.program || "Enterprise Program"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {r.clientPartner}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatINR(r.dealValue)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${
                            r.tenureType === "delivery"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                          }`}
                        >
                          {r.tenureType === "delivery" ? (
                            <>
                              <Truck className="w-3 h-3" />
                              <span>Delivery (% Milestone)</span>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-3 h-3" />
                              <span>Payment Terms</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          <span>{r.overallCompletionPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${r.overallCompletionPercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          <span>{percentReceived}%</span>
                          <span className="text-[10px] text-slate-400">({formatINR(receivedAmt)})</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${percentReceived}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            r.deliveryStatus === "delivered"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : r.deliveryStatus === "in_progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : r.deliveryStatus === "on_hold"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {r.deliveryStatus.replace("_", " ").toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRecord(r.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold text-xs transition cursor-pointer"
                          >
                            Manage Tenure
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDelete(r);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: IMPORT WON DEAL FROM PIPELINE (CLOSURE STAGE) */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Import Won Deal to Delivery
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a closed-won deal from the pipeline to launch delivery tracking and tenure setup.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {closureLeads.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No leads are currently in the Closure stage.
                </p>
                <p className="text-xs text-slate-400">
                  When a deal reaches the Closure column in the pipeline, it will appear here ready for delivery handoff.
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                {closureLeads.map((lead) => {
                  const alreadyImported = deliveryRecords.some((r) => r.leadId === lead.id);

                  return (
                    <div
                      key={lead.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition"
                    >
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {lead.companyName}
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                          <span>Value: <strong className="text-indigo-600 dark:text-indigo-400">{formatINR(lead.dealValue)}</strong></span>
                          <span>Owner: <strong>{lead.owner}</strong></span>
                          <span>Program: <strong>{lead.program}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {alreadyImported ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In Delivery</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleImportLead(lead, "delivery")}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1"
                              title="Set up with Delivery (% Completion) Tenure"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>To Delivery</span>
                            </button>
                            <button
                              onClick={() => handleImportLead(lead, "payment_terms")}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1"
                              title="Set up with Payment Terms Tenure"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Payment Terms</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: NEW CUSTOM DELIVERY PROJECT */}
      {/* ========================================================= */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewProject}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Create New Delivery Project
              </h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Company / Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectForm.companyName}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, companyName: e.target.value })
                  }
                  placeholder="e.g. Acme Global Industries"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Contract / Deal Value (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10000"
                  value={newProjectForm.dealValue}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, dealValue: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Program / Solution
                </label>
                <select
                  value={newProjectForm.program}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, program: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                >
                  <option value="Executive Coaching">Executive Coaching</option>
                  <option value="L&D Transformation">L&D Transformation</option>
                  <option value="TASC Inhouse">TASC Inhouse</option>
                  <option value="Assessments & Succession">Assessments & Succession</option>
                  <option value="Custom Delivery">Custom Delivery</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Initial Tenure Model
                </label>
                <select
                  value={newProjectForm.tenureType}
                  onChange={(e) =>
                    setNewProjectForm({
                      ...newProjectForm,
                      tenureType: e.target.value as TenureType,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                >
                  <option value="delivery">Delivery (Project Completion Milestones)</option>
                  <option value="payment_terms">Payment Terms (Advance & Schedule)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Create Delivery Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: DELETE PROJECT CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Delivery Project?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">{projectToDelete.companyName}</strong> from the delivery workspace?
                </p>
                <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-200 dark:border-slate-700">
                  <div>• Program: <span className="font-semibold text-slate-800 dark:text-slate-200">{projectToDelete.program}</span></div>
                  <div>• Value: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(projectToDelete.dealValue)}</span></div>
                  <div>• Tenure Model: <span className="font-semibold text-slate-800 dark:text-slate-200">{projectToDelete.tenureType === "delivery" ? "Delivery (% Milestone)" : "Payment Terms"}</span></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
