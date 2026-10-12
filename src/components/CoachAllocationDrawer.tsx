"use client";

import React, { useState } from "react";
import {
  Users,
  UserCheck,
  Plus,
  Trash2,
  Award,
  DollarSign,
  TrendingUp,
  Percent,
  Sparkles,
  CheckCircle2,
  Calendar,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { DeliveryRecord, CoachAssignment } from "@/types/delivery";

interface CoachAllocationDrawerProps {
  record: DeliveryRecord;
  onUpdateCoaches: (
    coaches: CoachAssignment[],
    totalSessions: number,
    completedSessions: number,
    totalFacultyCost: number
  ) => void;
  onClose?: () => void;
}

export const CoachAllocationDrawer: React.FC<CoachAllocationDrawerProps> = ({
  record,
  onUpdateCoaches,
  onClose,
}) => {
  const [coaches, setCoaches] = useState<CoachAssignment[]>(record.coaches || []);
  const [totalSessions, setTotalSessions] = useState<number>(
    record.coachingSessionsTotal || 12
  );
  const [completedSessions, setCompletedSessions] = useState<number>(
    record.coachingSessionsCompleted || 0
  );

  // New coach form
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachRole, setNewCoachRole] = useState<
    "lead_facilitator" | "executive_coach" | "program_manager" | "faculty"
  >("executive_coach");
  const [newCoachEmail, setNewCoachEmail] = useState("");
  const [newCoachPayout, setNewCoachPayout] = useState<number>(150000);
  const [newCoachAssigned, setNewCoachAssigned] = useState<number>(4);

  // Compute total faculty cost
  const totalFacultyCost = coaches.reduce((acc, c) => acc + (c.payoutRate || 0), 0);
  const dealValue = record.dealValue || 0;
  const grossMargin =
    dealValue > 0 ? ((dealValue - totalFacultyCost) / dealValue) * 100 : 100;

  const handleAddCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachName.trim()) return;

    const newAssignment: CoachAssignment = {
      id: `coach-${Date.now()}`,
      name: newCoachName.trim(),
      role: newCoachRole,
      email: newCoachEmail.trim() || undefined,
      payoutRate: Number(newCoachPayout) || 0,
      assignedSessionsCount: Number(newCoachAssigned) || 1,
      completedSessionsCount: 0,
    };

    const updated = [...coaches, newAssignment];
    setCoaches(updated);
    setNewCoachName("");
    setNewCoachEmail("");

    // Auto-update parent
    const cost = updated.reduce((acc, c) => acc + (c.payoutRate || 0), 0);
    onUpdateCoaches(updated, totalSessions, completedSessions, cost);
  };

  const handleRemoveCoach = (id: string) => {
    const updated = coaches.filter((c) => c.id !== id);
    setCoaches(updated);
    const cost = updated.reduce((acc, c) => acc + (c.payoutRate || 0), 0);
    onUpdateCoaches(updated, totalSessions, completedSessions, cost);
  };

  const handleUpdateCompleted = (id: string, delta: number) => {
    const updated = coaches.map((c) => {
      if (c.id === id) {
        const next = Math.max(0, Math.min(c.assignedSessionsCount, c.completedSessionsCount + delta));
        return { ...c, completedSessionsCount: next };
      }
      return c;
    });
    setCoaches(updated);

    const newCompleted = updated.reduce((acc, c) => acc + c.completedSessionsCount, 0);
    setCompletedSessions(newCompleted);

    const cost = updated.reduce((acc, c) => acc + (c.payoutRate || 0), 0);
    onUpdateCoaches(updated, totalSessions, newCompleted, cost);
  };

  const roleLabels: Record<string, string> = {
    lead_facilitator: "Lead Facilitator",
    executive_coach: "ICF Executive Coach",
    program_manager: "Program Manager",
    faculty: "Subject Faculty",
  };

  return (
    <div className="space-y-6">
      {/* Header Margin Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60">
          <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider block">
            Contracted Deal Value
          </span>
          <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
            {formatINR(dealValue)}
          </div>
          <span className="text-[10px] text-slate-400">Client Revenue</span>
        </div>

        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-900/60">
          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider block">
            Total Faculty Costs
          </span>
          <div className="text-base font-black text-amber-700 dark:text-amber-300 mt-0.5">
            {formatINR(totalFacultyCost)}
          </div>
          <span className="text-[10px] text-slate-400">
            {coaches.length} assigned coach{coaches.length !== 1 ? "es" : ""}
          </span>
        </div>

        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60">
          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider block">
            Gross Margin Profit
          </span>
          <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5 flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>{grossMargin.toFixed(1)}%</span>
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
            {formatINR(Math.max(0, dealValue - totalFacultyCost))} Net Contribution
          </span>
        </div>
      </div>

      {/* Global Coaching Sessions Counter */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Coaching & Workshop Sessions Progress Tracker
            </h4>
          </div>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
            {completedSessions} of {totalSessions} completed (
            {totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(0) : 0}%)
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
            style={{
              width: `${
                totalSessions > 0
                  ? Math.min(100, (completedSessions / totalSessions) * 100)
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Total Program Scope:</span>
            <input
              type="number"
              min={1}
              value={totalSessions}
              onChange={(e) => {
                const val = Number(e.target.value) || 1;
                setTotalSessions(val);
                onUpdateCoaches(coaches, val, completedSessions, totalFacultyCost);
              }}
              className="w-16 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-center text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <span className="text-[11px] text-slate-400">sessions</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Completed Sessions:</span>
            <button
              type="button"
              onClick={() => {
                const next = Math.max(0, completedSessions - 1);
                setCompletedSessions(next);
                onUpdateCoaches(coaches, totalSessions, next, totalFacultyCost);
              }}
              className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="font-black text-slate-900 dark:text-white px-1">
              {completedSessions}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = completedSessions + 1;
                setCompletedSessions(next);
                onUpdateCoaches(coaches, totalSessions, next, totalFacultyCost);
              }}
              className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Faculty Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Assigned Faculty & Executive Coaches ({coaches.length})</span>
          </h4>
        </div>

        {coaches.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
            No coaches or faculty assigned yet. Add an executive coach below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coaches.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 dark:text-white text-xs">
                        {c.name}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                        {roleLabels[c.role] || c.role}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCoach(c.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer"
                    title="Remove assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Faculty Payout</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatINR(c.payoutRate || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sessions Delivered</span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateCompleted(c.id, -1)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-black text-slate-900 dark:text-white text-xs">
                        {c.completedSessionsCount}/{c.assignedSessionsCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCompleted(c.id, 1)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Coach Form */}
      <form
        onSubmit={handleAddCoach}
        className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3"
      >
        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          <span>Assign New Executive Coach / Facilitator</span>
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">
              Coach Full Name *
            </label>
            <input
              type="text"
              required
              value={newCoachName}
              onChange={(e) => setNewCoachName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Khanna, PCC"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">
              Faculty Role
            </label>
            <select
              value={newCoachRole}
              onChange={(e) =>
                setNewCoachRole(
                  e.target.value as
                    | "lead_facilitator"
                    | "executive_coach"
                    | "program_manager"
                    | "faculty"
                )
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="executive_coach">ICF Executive Coach</option>
              <option value="lead_facilitator">Lead Facilitator</option>
              <option value="program_manager">Program Manager</option>
              <option value="faculty">Subject Faculty</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">
              Agreed Payout (INR)
            </label>
            <input
              type="number"
              step={1000}
              value={newCoachPayout}
              onChange={(e) => setNewCoachPayout(Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Confirm Coach Assignment</span>
          </button>
        </div>
      </form>
    </div>
  );
};
