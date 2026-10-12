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
import {
  DeliveryRecord,
  DeliveryMilestoneTranche,
  PaymentTermTranche,
  TenureType,
  DeliveryLog,
} from "@/types/delivery";
import { Lead } from "@/types/lead";

const DELIVERY_COLLECTION = "b2b_delivery_records";
const DELIVERY_STORAGE_KEY = "xmonks_b2b_delivery_records";
const DELIVERY_INITIALIZED_KEY = "xmonks_b2b_delivery_initialized_v1";

export function createDefaultDeliveryMilestones(dealValue: number): DeliveryMilestoneTranche[] {
  return [
    {
      id: `milestone-${Date.now()}-1`,
      milestoneTitle: "Phase 1: Diagnostic & Project Kickoff",
      projectCompletionPercent: 20,
      paymentPercent: 30,
      amount: Math.round(dealValue * 0.3),
      milestoneStatus: "completed",
      paymentStatus: "received",
      targetDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      completionDate: new Date().toISOString().split("T")[0],
      paymentReceivedDate: new Date().toISOString().split("T")[0],
      notes: "Project charter approved and kickoff workshop delivered.",
    },
    {
      id: `milestone-${Date.now()}-2`,
      milestoneTitle: "Phase 2: Core Program Execution & Mid-term Cohort",
      projectCompletionPercent: 60,
      paymentPercent: 40,
      amount: Math.round(dealValue * 0.4),
      milestoneStatus: "in_progress",
      paymentStatus: "pending",
      targetDate: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
      notes: "Execution of group coaching sessions and development sprints.",
    },
    {
      id: `milestone-${Date.now()}-3`,
      milestoneTitle: "Phase 3: Final Delivery, Evaluation & Sign-off",
      projectCompletionPercent: 100,
      paymentPercent: 30,
      amount: Math.round(dealValue * 0.3),
      milestoneStatus: "pending",
      paymentStatus: "pending",
      targetDate: new Date(Date.now() + 120 * 86400000).toISOString().split("T")[0],
      notes: "Final impact assessment, leadership sponsor report, and final signoff.",
    },
  ];
}

export function createDefaultPaymentTerms(dealValue: number): PaymentTermTranche[] {
  return [
    {
      id: `term-${Date.now()}-1`,
      termLabel: "Advance Payment",
      isAdvance: true,
      timeframe: "Advance (Immediate on PO/Contract)",
      paymentPercent: 30,
      amount: Math.round(dealValue * 0.3),
      dueDate: new Date().toISOString().split("T")[0],
      paymentStatus: "received",
      paymentReceivedDate: new Date().toISOString().split("T")[0],
      notes: "30% upfront mobilization advance payment received.",
    },
    {
      id: `term-${Date.now()}-2`,
      termLabel: "Installment 1",
      isAdvance: false,
      timeframe: "After 3 Months",
      paymentPercent: 20,
      amount: Math.round(dealValue * 0.2),
      dueDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      paymentStatus: "pending",
      notes: "20% scheduled installment due at month 3 mark.",
    },
    {
      id: `term-${Date.now()}-3`,
      termLabel: "Installment 2",
      isAdvance: false,
      timeframe: "After 6 Months",
      paymentPercent: 30,
      amount: Math.round(dealValue * 0.3),
      dueDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
      paymentStatus: "pending",
      notes: "30% scheduled installment due at month 6 mark.",
    },
    {
      id: `term-${Date.now()}-4`,
      termLabel: "Final Settlement",
      isAdvance: false,
      timeframe: "On Completion / Sign-off",
      paymentPercent: 20,
      amount: Math.round(dealValue * 0.2),
      dueDate: new Date(Date.now() + 270 * 86400000).toISOString().split("T")[0],
      paymentStatus: "pending",
      notes: "Final 20% retainage balance due upon delivery completion.",
    },
  ];
}

// Initial demonstration seed records so the delivery workspace is immediately rich & usable
export const INITIAL_DELIVERY_RECORDS: DeliveryRecord[] = [
  {
    id: "deliv-techcorp-001",
    leadId: "lead-techcorp-sample",
    companyName: "TechCorp Global Solutions",
    contactName: "Vikram Malhotra",
    contactEmail: "vikram.m@techcorp.com",
    contactPhone: "+91 98200 45892",
    city: "Bengaluru",
    industry: "Technology",
    program: "Executive Coaching",
    dealValue: 2400000,
    clientPartner: "Amit Shelly",
    deliveryLead: "Pooja Verma (Delivery Ops)",
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    tenureType: "delivery",
    deliveryStatus: "in_progress",
    overallCompletionPercent: 35,
    startDate: "2026-02-01",
    targetCompletionDate: "2026-06-30",
    notes: "Enterprise leadership transformational journey for 20 senior directors.",
    deliveryMilestones: [
      {
        id: "m-tc-1",
        milestoneTitle: "Phase 1: 360 Diagnostic & Kickoff Alignment",
        projectCompletionPercent: 20,
        paymentPercent: 30,
        amount: 720000,
        milestoneStatus: "completed",
        paymentStatus: "received",
        targetDate: "2026-02-15",
        completionDate: "2026-02-14",
        paymentReceivedDate: "2026-02-20",
        invoiceNumber: "INV-XM-2026-042",
        notes: "Diagnostic reports and sponsor briefing concluded.",
      },
      {
        id: "m-tc-2",
        milestoneTitle: "Phase 2: Core Cohort Coaching & Mid-Journey Review",
        projectCompletionPercent: 60,
        paymentPercent: 40,
        amount: 960000,
        milestoneStatus: "in_progress",
        paymentStatus: "invoiced",
        targetDate: "2026-04-30",
        invoiceNumber: "INV-XM-2026-089",
        notes: "Cohort midway through 1-on-1 coaching sessions.",
      },
      {
        id: "m-tc-3",
        milestoneTitle: "Phase 3: Final Leadership Immersion & Sign-off",
        projectCompletionPercent: 100,
        paymentPercent: 30,
        amount: 720000,
        milestoneStatus: "pending",
        paymentStatus: "pending",
        targetDate: "2026-06-30",
        notes: "Graduation debrief with CXO steering committee.",
      },
    ],
    paymentTerms: createDefaultPaymentTerms(2400000),
    deliveryLogs: [
      {
        id: "log-1",
        timestamp: new Date(Date.now() - 20 * 86400000).toISOString(),
        formattedDate: "20 Feb 2026",
        author: "Pooja Verma",
        type: "payment_received",
        message: "Phase 1 payment of ₹7,20,000 received via wire transfer.",
      },
      {
        id: "log-2",
        timestamp: new Date().toISOString(),
        formattedDate: "Today",
        author: "Amit Shelly",
        type: "milestone_update",
        message: "Phase 2 coaching underway. Completion at 35%.",
      },
    ],
  },
  {
    id: "deliv-apex-002",
    leadId: "lead-apex-sample",
    companyName: "Apex Financial Holdings",
    contactName: "Sunita Roy",
    contactEmail: "sunita.roy@apexfin.com",
    contactPhone: "+91 99301 22891",
    city: "Mumbai",
    industry: "BFSI",
    program: "L&D Transformation",
    dealValue: 1800000,
    clientPartner: "Preeti",
    deliveryLead: "Rohit Saxena",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    tenureType: "payment_terms",
    deliveryStatus: "in_progress",
    overallCompletionPercent: 20,
    startDate: "2026-02-15",
    targetCompletionDate: "2026-11-30",
    notes: "Executive succession development and coaching academy.",
    deliveryMilestones: createDefaultDeliveryMilestones(1800000),
    paymentTerms: [
      {
        id: "pt-ap-1",
        termLabel: "Advance Payment",
        isAdvance: true,
        timeframe: "Advance (Immediate on Signing)",
        paymentPercent: 30,
        amount: 540000,
        dueDate: "2026-02-15",
        paymentStatus: "received",
        paymentReceivedDate: "2026-02-22",
        invoiceNumber: "INV-XM-2026-051",
        notes: "30% advance received upon contract signing.",
      },
      {
        id: "pt-ap-2",
        termLabel: "Installment 1",
        isAdvance: false,
        timeframe: "After 3 Months",
        paymentPercent: 20,
        amount: 360000,
        dueDate: "2026-05-15",
        paymentStatus: "pending",
        notes: "Scheduled term after 3 months of contract commencement.",
      },
      {
        id: "pt-ap-3",
        termLabel: "Installment 2",
        isAdvance: false,
        timeframe: "After 6 Months",
        paymentPercent: 30,
        amount: 540000,
        dueDate: "2026-08-15",
        paymentStatus: "pending",
        notes: "Scheduled term after 6 months of delivery.",
      },
      {
        id: "pt-ap-4",
        termLabel: "Final Settlement",
        isAdvance: false,
        timeframe: "On Completion / Sign-off",
        paymentPercent: 20,
        amount: 360000,
        dueDate: "2026-11-15",
        paymentStatus: "pending",
        notes: "Final sign-off balance.",
      },
    ],
    deliveryLogs: [
      {
        id: "log-ap-1",
        timestamp: new Date().toISOString(),
        formattedDate: "Today",
        author: "Preeti",
        type: "status_change",
        message: "Advance received, delivery initiated under Payment Terms model.",
      },
    ],
  },
];

export function getStoredDeliveryRecords(): DeliveryRecord[] {
  if (typeof window === "undefined") return INITIAL_DELIVERY_RECORDS;
  try {
    const raw = localStorage.getItem(DELIVERY_STORAGE_KEY);
    if (raw) {
      const parsed: DeliveryRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    const isInitialized = localStorage.getItem(DELIVERY_INITIALIZED_KEY) === "true";
    if (!isInitialized) {
      localStorage.setItem(DELIVERY_INITIALIZED_KEY, "true");
      saveLocalDeliveryRecords(INITIAL_DELIVERY_RECORDS);
      return INITIAL_DELIVERY_RECORDS;
    }
    return [];
  } catch (e) {
    console.warn("Error reading delivery records from localStorage", e);
    return INITIAL_DELIVERY_RECORDS;
  }
}

export function saveLocalDeliveryRecords(records: DeliveryRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn("Failed to save delivery records to localStorage", e);
  }
}

export function subscribeToDeliveryRecords(
  onData: (records: DeliveryRecord[], isFirebaseSyncing: boolean) => void
): () => void {
  const initialLocal = getStoredDeliveryRecords();
  onData(initialLocal, false);

  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, DELIVERY_COLLECTION);
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteRecords: DeliveryRecord[] = snapshot.docs.map((d) => ({
            ...(d.data() as Omit<DeliveryRecord, "id">),
            id: d.id,
          }));
          localStorage.setItem(DELIVERY_INITIALIZED_KEY, "true");
          saveLocalDeliveryRecords(remoteRecords);
          onData(remoteRecords, true);
        } else {
          const isInitialized = localStorage.getItem(DELIVERY_INITIALIZED_KEY) === "true";
          if (!isInitialized && initialLocal.length > 0) {
            localStorage.setItem(DELIVERY_INITIALIZED_KEY, "true");
            saveLocalDeliveryRecords(initialLocal);
            initialLocal.forEach((item) => {
              const docRef = doc(db, DELIVERY_COLLECTION, item.id);
              setDoc(docRef, item).catch(() => {});
            });
            onData(initialLocal, true);
          } else {
            saveLocalDeliveryRecords([]);
            onData([], true);
          }
        }
      },
      (error) => {
        console.warn("Firestore delivery subscription fallback to local:", error);
        onData(getStoredDeliveryRecords(), false);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Could not setup Firestore delivery listener, using localStorage", err);
    return () => {};
  }
}

export async function createDeliveryRecordFromLead(
  lead: Lead,
  tenureType: TenureType = "delivery",
  deliveryLead: string = "Unassigned"
): Promise<DeliveryRecord> {
  const existing = getStoredDeliveryRecords();
  const existingRecord = existing.find((r) => r.leadId === lead.id);

  if (existingRecord) {
    return existingRecord;
  }

  const newId = `deliv-${lead.id}-${Date.now().toString().slice(-4)}`;
  const dealValue = lead.dealValue || 0;

  const newRecord: DeliveryRecord = {
    id: newId,
    leadId: lead.id,
    companyName: lead.companyName,
    contactName: lead.contactName || "Contact Person",
    contactEmail: lead.contactEmail,
    contactPhone: lead.contactPhone,
    city: lead.city,
    industry: lead.industry,
    program: lead.program,
    dealValue: dealValue,
    clientPartner: lead.owner || "Sales Representative",
    deliveryLead: deliveryLead,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Copy all preexisting pipeline data
    companyLogo: lead.companyLogo,
    designation: lead.designation,
    leadSource: lead.leadSource,
    stage: lead.stage,
    weightage: lead.weightage,
    closureMonth: lead.closureMonth,
    expectedCloseDate: lead.expectedCloseDate,
    pipelineNotes: lead.notes,
    additionalContacts: lead.additionalContacts || [],
    approachNotes: lead.approachNotes || (lead.approachNote ? [lead.approachNote] : []),
    financialDocuments: lead.financialDocuments || [],
    journeyLogs: lead.journeyLogs || [],

    tenureType: tenureType,
    deliveryStatus: "not_started",
    overallCompletionPercent: 0,
    startDate: new Date().toISOString().split("T")[0],
    targetCompletionDate: lead.closureMonth
      ? `${lead.closureMonth}-28`
      : new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
    notes: lead.notes || `Won closure deal transferred to delivery pipeline.`,
    deliveryMilestones: createDefaultDeliveryMilestones(dealValue),
    paymentTerms: createDefaultPaymentTerms(dealValue),
    deliveryLogs: [
      {
        id: `log-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        formattedDate: new Date().toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        author: lead.owner || "System",
        type: "status_change",
        message: `Won deal transferred from Closure stage to Delivery pipeline.`,
      },
    ],
  };

  const updatedRecords = [newRecord, ...existing];
  saveLocalDeliveryRecords(updatedRecords);

  if (db) {
    try {
      const docRef = doc(db, DELIVERY_COLLECTION, newRecord.id);
      await setDoc(docRef, newRecord);
    } catch (e) {
      console.warn("Could not save delivery record to Firestore", e);
    }
  }

  return newRecord;
}

export async function updateDeliveryRecord(
  recordId: string,
  updates: Partial<DeliveryRecord>,
  author: string = "User"
): Promise<DeliveryRecord | null> {
  const existing = getStoredDeliveryRecords();
  const idx = existing.findIndex((r) => r.id === recordId);
  if (idx === -1) return null;

  const current = existing[idx];
  const logs = [...(current.deliveryLogs || [])];

  if (updates.tenureType && updates.tenureType !== current.tenureType) {
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      author,
      type: "tenure_change",
      message: `Tenure model switched to ${
        updates.tenureType === "delivery"
          ? "Delivery (% Completion Milestones)"
          : "Payment Terms (Time & Advance Schedule)"
      }.`,
    });
  }

  if (updates.deliveryStatus && updates.deliveryStatus !== current.deliveryStatus) {
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      author,
      type: "status_change",
      message: `Project delivery status updated to ${updates.deliveryStatus.toUpperCase()}.`,
    });
  }

  const updatedRecord: DeliveryRecord = {
    ...current,
    ...updates,
    deliveryLogs: logs,
    updatedAt: new Date().toISOString(),
  };

  existing[idx] = updatedRecord;
  saveLocalDeliveryRecords(existing);

  if (db) {
    try {
      const docRef = doc(db, DELIVERY_COLLECTION, recordId);
      await setDoc(docRef, updatedRecord);
    } catch (e) {
      console.warn("Failed to persist delivery update to Firestore", e);
    }
  }

  return updatedRecord;
}

export async function deleteDeliveryRecord(recordId: string): Promise<boolean> {
  const existing = getStoredDeliveryRecords();
  const filtered = existing.filter((r) => r.id !== recordId);
  saveLocalDeliveryRecords(filtered);

  if (db) {
    try {
      const docRef = doc(db, DELIVERY_COLLECTION, recordId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Failed to delete delivery record from Firestore", e);
    }
  }

  return true;
}
