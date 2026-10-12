export type TenureType = "delivery" | "payment_terms";

export type MilestoneCompletionStatus = "pending" | "in_progress" | "completed";
export type TranchePaymentStatus = "pending" | "invoiced" | "received" | "overdue";
export type DeliveryOverallStatus = "not_started" | "in_progress" | "delivered" | "on_hold";

/**
 * 1. Delivery Option: Milestone & Project Completion Linked Payment Tranche
 * Example: 20% of project completed -> 30% payment triggered
 */
export interface DeliveryMilestoneTranche {
  id: string;
  milestoneTitle: string; // e.g. "Phase 1: Project Kickoff & Discovery"
  projectCompletionPercent: number; // e.g. 20 (meaning 20% of project completed)
  paymentPercent: number; // e.g. 30 (meaning 30% payment released)
  amount: number; // Auto-calculated: dealValue * (paymentPercent / 100)
  milestoneStatus: MilestoneCompletionStatus;
  paymentStatus: TranchePaymentStatus;
  targetDate?: string;
  completionDate?: string;
  paymentReceivedDate?: string;
  invoiceNumber?: string;
  notes?: string;
}

/**
 * 2. Payment Terms Option: Time & Schedule / Advance Payment Tranche
 * Example: 30% advance payment upfront -> 20% after 3 months
 */
export interface PaymentTermTranche {
  id: string;
  termLabel: string; // e.g. "Advance Payment", "Installment 1", "Final Balance"
  isAdvance?: boolean;
  timeframe: string; // e.g. "Advance (Immediate)", "After 1 Month", "After 2 Months", "After 3 Months", "After 6 Months", "On Completion"
  paymentPercent: number; // e.g. 30
  amount: number; // Auto-calculated: dealValue * (paymentPercent / 100)
  dueDate?: string;
  paymentStatus: TranchePaymentStatus;
  paymentReceivedDate?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface DeliveryLog {
  id: string;
  timestamp: string;
  formattedDate: string;
  author: string;
  type: "status_change" | "milestone_update" | "payment_received" | "tenure_change" | "note";
  message: string;
}

export interface DeliveryRecord {
  id: string;
  leadId: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  industry?: string;
  program?: string;
  dealValue: number; // Total Project / Contract Value in INR
  clientPartner: string;
  deliveryLead?: string; // Assigned delivery lead / manager
  createdAt: string;
  updatedAt: string;

  // Tenure Configuration
  tenureType: TenureType; // "delivery" | "payment_terms"

  // Option 1: Delivery (Project Completion Milestones)
  deliveryMilestones: DeliveryMilestoneTranche[];

  // Option 2: Payment Terms (Time / Advance Schedule)
  paymentTerms: PaymentTermTranche[];

  // Delivery Execution Stats
  deliveryStatus: DeliveryOverallStatus;
  overallCompletionPercent: number; // 0 - 100%
  startDate?: string;
  targetCompletionDate?: string;
  notes?: string;
  deliveryLogs?: DeliveryLog[];
}
