import { DeliveryRecord, DeliveryMilestoneTranche, PaymentTermTranche } from "@/types/delivery";

export interface OverdueItem {
  recordId: string;
  companyName: string;
  clientPartner: string;
  itemType: "milestone" | "payment_term";
  title: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  agingBucket: "under_30" | "days_30_60" | "days_60_plus";
  invoiceNumber?: string;
}

export interface AgingReceivablesSummary {
  under30Days: {
    amount: number;
    count: number;
    items: OverdueItem[];
  };
  days30to60: {
    amount: number;
    count: number;
    items: OverdueItem[];
  };
  days60Plus: {
    amount: number;
    count: number;
    items: OverdueItem[];
  };
  totalOverdueAmount: number;
  totalPendingAmount: number;
  highRiskCount: number;
}

export interface DeliveryHealthSummary {
  onTrackCount: number;
  atRiskCount: number;
  stalledCount: number;
  totalProjects: number;
}

export interface CoachingFacultyMetrics {
  totalAssignedCoaches: number;
  totalSessionsPlanned: number;
  totalSessionsCompleted: number;
  overallCompletionRate: number;
  totalFacultyPayouts: number;
  totalContractRevenue: number;
  grossMarginPercent: number;
}

/**
 * Calculates days overdue from a given ISO date string (YYYY-MM-DD or ISO timestamp)
 */
export function getDaysOverdue(dateString?: string): number {
  if (!dateString) return 0;
  const target = new Date(dateString);
  if (isNaN(target.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Categorizes an overdue amount into aging buckets
 */
export function getAgingBucket(daysOverdue: number): "under_30" | "days_30_60" | "days_60_plus" {
  if (daysOverdue <= 30) return "under_30";
  if (daysOverdue <= 60) return "days_30_60";
  return "days_60_plus";
}

/**
 * Analyzes all accessible delivery records to extract overdue items and aging receivable buckets
 */
export function calculateAgingReceivables(records: DeliveryRecord[]): AgingReceivablesSummary {
  const under30Items: OverdueItem[] = [];
  const days30to60Items: OverdueItem[] = [];
  const days60PlusItems: OverdueItem[] = [];

  let totalPending = 0;
  let totalOverdue = 0;

  records.forEach((r) => {
    // 1. Check Delivery Milestones
    (r.deliveryMilestones || []).forEach((m) => {
      if (m.paymentStatus !== "received") {
        totalPending += m.amount || 0;
        const target = m.targetDate;
        if (target) {
          const days = getDaysOverdue(target);
          if (days > 0) {
            totalOverdue += m.amount || 0;
            const bucket = getAgingBucket(days);
            const item: OverdueItem = {
              recordId: r.id,
              companyName: r.companyName,
              clientPartner: r.clientPartner,
              itemType: "milestone",
              title: m.milestoneTitle,
              amount: m.amount || 0,
              dueDate: target,
              daysOverdue: days,
              agingBucket: bucket,
              invoiceNumber: m.invoiceNumber,
            };

            if (bucket === "under_30") under30Items.push(item);
            else if (bucket === "days_30_60") days30to60Items.push(item);
            else days60PlusItems.push(item);
          }
        }
      }
    });

    // 2. Check Payment Terms
    (r.paymentTerms || []).forEach((t) => {
      if (t.paymentStatus !== "received") {
        totalPending += t.amount || 0;
        const due = t.dueDate;
        if (due) {
          const days = getDaysOverdue(due);
          if (days > 0) {
            totalOverdue += t.amount || 0;
            const bucket = getAgingBucket(days);
            const item: OverdueItem = {
              recordId: r.id,
              companyName: r.companyName,
              clientPartner: r.clientPartner,
              itemType: "payment_term",
              title: t.termLabel,
              amount: t.amount || 0,
              dueDate: due,
              daysOverdue: days,
              agingBucket: bucket,
              invoiceNumber: t.invoiceNumber,
            };

            if (bucket === "under_30") under30Items.push(item);
            else if (bucket === "days_30_60") days30to60Items.push(item);
            else days60PlusItems.push(item);
          }
        }
      }
    });
  });

  const sumUnder30 = under30Items.reduce((acc, i) => acc + i.amount, 0);
  const sum30to60 = days30to60Items.reduce((acc, i) => acc + i.amount, 0);
  const sum60Plus = days60PlusItems.reduce((acc, i) => acc + i.amount, 0);

  return {
    under30Days: {
      amount: sumUnder30,
      count: under30Items.length,
      items: under30Items.sort((a, b) => b.daysOverdue - a.daysOverdue),
    },
    days30to60: {
      amount: sum30to60,
      count: days30to60Items.length,
      items: days30to60Items.sort((a, b) => b.daysOverdue - a.daysOverdue),
    },
    days60Plus: {
      amount: sum60Plus,
      count: days60PlusItems.length,
      items: days60PlusItems.sort((a, b) => b.daysOverdue - a.daysOverdue),
    },
    totalOverdueAmount: totalOverdue,
    totalPendingAmount: totalPending,
    highRiskCount: days60PlusItems.length,
  };
}

/**
 * Calculates project health distribution
 */
export function calculateDeliveryHealth(records: DeliveryRecord[]): DeliveryHealthSummary {
  let onTrackCount = 0;
  let atRiskCount = 0;
  let stalledCount = 0;

  records.forEach((r) => {
    const health = r.projectHealth || "on_track";
    if (health === "stalled") stalledCount++;
    else if (health === "at_risk") atRiskCount++;
    else onTrackCount++;
  });

  return {
    onTrackCount,
    atRiskCount,
    stalledCount,
    totalProjects: records.length,
  };
}

/**
 * Calculates coaching faculty staffing metrics & gross profit margins
 */
export function calculateCoachingFacultyMetrics(records: DeliveryRecord[]): CoachingFacultyMetrics {
  let totalAssignedCoaches = 0;
  let totalSessionsPlanned = 0;
  let totalSessionsCompleted = 0;
  let totalFacultyPayouts = 0;
  let totalContractRevenue = 0;

  records.forEach((r) => {
    totalContractRevenue += r.dealValue || 0;

    const coaches = r.coaches || [];
    totalAssignedCoaches += coaches.length;

    let recPlanned = r.coachingSessionsTotal || 0;
    let recCompleted = r.coachingSessionsCompleted || 0;
    let recCost = r.totalFacultyCost || 0;

    coaches.forEach((c) => {
      recPlanned += c.assignedSessionsCount || 0;
      recCompleted += c.completedSessionsCount || 0;
      recCost += c.payoutRate || 0;
    });

    totalSessionsPlanned += recPlanned;
    totalSessionsCompleted += recCompleted;
    totalFacultyPayouts += recCost;
  });

  const overallCompletionRate =
    totalSessionsPlanned > 0 ? (totalSessionsCompleted / totalSessionsPlanned) * 100 : 0;

  const grossMarginPercent =
    totalContractRevenue > 0
      ? ((totalContractRevenue - totalFacultyPayouts) / totalContractRevenue) * 100
      : 100;

  return {
    totalAssignedCoaches,
    totalSessionsPlanned,
    totalSessionsCompleted,
    overallCompletionRate,
    totalFacultyPayouts,
    totalContractRevenue,
    grossMarginPercent,
  };
}

/**
 * Exports complete Delivery Portfolio to CSV
 */
export function generateDeliveryPortfolioCSV(records: DeliveryRecord[]): string {
  const headers = [
    "Project ID",
    "Company Name",
    "Program",
    "Client Partner",
    "Delivery Lead",
    "Deal Value (INR)",
    "Tenure Model",
    "Delivery Status",
    "Project Health",
    "Overall Completion %",
    "Total Invoiced (INR)",
    "Unbilled Book (INR)",
    "Start Date",
    "Target Completion Date",
    "Closure Month",
    "Health Blocker / Notes",
  ];

  const rows = records.map((r) => {
    let invoiced = 0;
    (r.deliveryMilestones || []).forEach((m) => {
      if (m.paymentStatus === "invoiced" || m.paymentStatus === "received" || m.invoiceNumber) invoiced += m.amount || 0;
    });
    (r.paymentTerms || []).forEach((t) => {
      if (t.paymentStatus === "invoiced" || t.paymentStatus === "received" || t.invoiceNumber) invoiced += t.amount || 0;
    });
    const unbilled = Math.max(0, (r.dealValue || 0) - invoiced);

    return [
      `"${r.id}"`,
      `"${(r.companyName || "").replace(/"/g, '""')}"`,
      `"${(r.program || "").replace(/"/g, '""')}"`,
      `"${(r.clientPartner || "").replace(/"/g, '""')}"`,
      `"${(r.deliveryLead || "").replace(/"/g, '""')}"`,
      r.dealValue || 0,
      `"${r.tenureType}"`,
      `"${r.deliveryStatus}"`,
      `"${r.projectHealth || "on_track"}"`,
      `${r.overallCompletionPercent || 0}%`,
      invoiced,
      unbilled,
      `"${r.startDate || ""}"`,
      `"${r.targetCompletionDate || ""}"`,
      `"${r.closureMonth || ""}"`,
      `"${(r.healthBlocker || r.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Exports Lead Owner & Invoicing Matrix to CSV
 */
export function generateExecutiveMatrixCSV(
  records: DeliveryRecord[],
  ownerList: Array<{
    owner: string;
    accountsCount: number;
    totalMoney: number;
    invoicedMoney?: number;
    receivedMoney?: number;
    remainingMoney: number;
    invoicingRate?: number;
    realizationRate?: number;
  }>
): string {
  const headers = [
    "Lead Owner",
    "Accounts Managed",
    "Project Cost (INR)",
    "Total Invoiced (INR)",
    "Unbilled Book (INR)",
    "Invoicing Rate (%)",
  ];

  const rows = ownerList.map((o) => {
    const inv = o.invoicedMoney ?? o.receivedMoney ?? 0;
    const rate = o.invoicingRate ?? o.realizationRate ?? 0;
    return [
      `"${o.owner}"`,
      o.accountsCount,
      o.totalMoney,
      inv,
      o.remainingMoney,
      `${rate.toFixed(1)}%`,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Browser helper to trigger CSV file download
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
