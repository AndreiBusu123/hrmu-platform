/**
 * HRMU Platform - TypeScript Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the application.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export type UserRole =
  | 'owner'
  | 'field_manager'
  | 'sales'
  | 'worker'
  | 'admin';

export type DashboardAccess = 'site_manager' | 'sales_marketing' | 'both';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  permissions: string[];
  dashboardAccess: DashboardAccess[];
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  isActive: boolean;
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface ClientContact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Client {
  clientId: string;
  name: string;
  invoicingContact: ClientContact;
  quotingContact: ClientContact;
  hsrContact: ClientContact;  // Health & Safety Representative
  siteContact: ClientContact;
  addresses: Address[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isNewWorksite?: boolean;  // Not in Google Maps
  showInGoogleMaps?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// ============================================================================
// JOB TYPES
// ============================================================================

export type JobStage =
  | 'Request'
  | 'Quote'
  | 'Won'
  | 'InProgress'
  | 'Complete'
  | 'Dispute';

export type JobUrgency = 'Low' | 'Medium' | 'High' | 'Critical';

export type QuoteFormat =
  | 'Standard'
  | 'Detailed'
  | 'Summary'
  | 'Custom';

export interface JobStaff {
  quoter?: string;  // User ID
  projectManager?: string;
  teamLeader?: string;
  hsrSite?: string;  // Health & Safety Rep on site
}

export interface QuoteDetails {
  format: QuoteFormat;
  specialTerms?: string;
  scopeOfWorks?: string;
  scopeTextWithoutNumbering?: string;
  scopeTextWithNumbering?: string;
  additionalTerms?: string;
  remSQM?: number;  // Quote-specific metric
}

export interface ImportantDates {
  expiryDate?: Timestamp;
  estimatedStartDate?: Timestamp;
  estimatedWeeks?: number;
  estimatedEndDate?: Timestamp;
  followupDate?: Timestamp;
  sentDate?: Timestamp;
  revisedSentDate?: Timestamp;
  jobWonDate?: Timestamp;
  onHoldDate?: Timestamp;
  handoverDate?: Timestamp;
  completedDate?: Timestamp;
}

export interface JobChecklist {
  weeklyInspection: boolean;
  monthlyInspection: boolean;
  worksafeNotifiableInspection: boolean;  // Over 5m
  electricalInspectionPowerlines: boolean;
  electricalInspectionStreetCables: boolean;
  produceTrafficPlan: boolean;
  orderConsultingEngineering: boolean;
  orderPS1Engineering: boolean;
  orderPS4Engineering: boolean;
  reviewedByOperationsManagement: boolean;
}

export interface JobDocument {
  documentId: string;
  name: string;
  url: string;
  type: 'photo' | 'document';
  uploadedBy: string;
  uploadedAt: Timestamp;
  size?: number;
  mimeType?: string;
}

export interface Job {
  jobId: string;  // Auto-generated or custom
  jobReferenceNumber: string;
  jobStage: JobStage;
  mainServiceLocation: string;
  urgency: JobUrgency;

  // Client Information
  clientForInvoicing: string;  // Client ID
  clientQuotingContact: string;
  clientHSR: string;  // Health & Safety Rep
  clientSiteContact: string;
  clientJobPO?: string;  // Purchase Order

  // Worksite Details
  isNewWorksiteAddress: boolean;
  worksiteAddress: Address;
  showInGoogleMaps: boolean;
  workComments?: string;

  // Staff Assignments
  addedBy: string;  // User ID
  staff: JobStaff;
  meetQuoterOnsite?: string;  // Dropdown value
  dateTimeToMeetClient?: Timestamp;
  quoteRequiredBy?: Timestamp;
  worksafeNoticeExpiryDate?: Timestamp;

  // Quote Information
  quote: QuoteDetails;

  // Important Dates
  dates: ImportantDates;

  // Checklist
  checklist: JobChecklist;

  // Documents and Photos
  documents: JobDocument[];  // Up to 20+ documents
  photos: JobDocument[];  // Up to 20+ photos

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

export type ActivityType =
  | 'Alterations'
  | 'DayLabour'
  | 'Delivery'
  | 'DismantleDayworks'
  | 'DismantleScaffold';

export interface ActivityTask {
  taskId: string;
  description: string;
  assignedTo?: string[];  // User IDs
  completed: boolean;
  completedAt?: Timestamp;
  estimatedHours?: number;
}

export interface ActivityChecklist {
  checklistId: string;
  name: string;
  items: {
    itemId: string;
    description: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: Timestamp;
  }[];
}

export interface TimeAllocation {
  userId: string;
  allocatedHours: number;
  actualHours?: number;
}

export interface Activity {
  activityId: string;
  jobId: string;
  type: ActivityType;
  name: string;
  description?: string;

  // Staff and Scheduling
  staff: string[];  // User IDs
  startDate: Timestamp;
  endDate?: Timestamp;

  // Work Management
  tasks: ActivityTask[];
  checklists: ActivityChecklist[];
  workNotes: string;

  // On-site Tracking
  onSiteStaff: string[];  // Currently on-site user IDs
  timeAllocations: TimeAllocation[];

  // Status and Documents
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  documents: JobDocument[];

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Paid'
  | 'Overdue'
  | 'Disputed';

export interface InvoiceLineItem {
  lineItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

export interface InvoiceReminders {
  autoEnabled: boolean;
  lastSent?: Timestamp;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  nextReminderDate?: Timestamp;
}

export interface EmailHistory {
  emailId: string;
  sentTo: string;
  sentAt: Timestamp;
  subject: string;
  opened?: boolean;
  openedAt?: Timestamp;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  jobId: string;
  clientId: string;

  // Line Items
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;

  // Status and Dates
  status: InvoiceStatus;
  sentDate?: Timestamp;
  dueDate?: Timestamp;
  paidDate?: Timestamp;

  // Automation
  reminders: InvoiceReminders;

  // Documents and Communication
  pdfUrl?: string;
  emailHistory: EmailHistory[];
  notes?: string;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// TIMESHEET & LOCATION TRACKING TYPES
// ============================================================================

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface ClockEvent {
  timestamp: Timestamp;
  location: LocationData;
  photo?: string;  // URL to photo
  deviceInfo?: {
    platform: 'ios' | 'android';
    deviceId: string;
    appVersion: string;
  };
}

export interface Breadcrumb {
  timestamp: Timestamp;
  location: LocationData;
  batteryLevel?: number;
}

export interface Timesheet {
  timesheetId: string;
  userId: string;
  jobId: string;
  activityId?: string;

  // Clock In/Out
  clockIn: ClockEvent;
  clockOut?: ClockEvent;

  // Location Tracking
  breadcrumbs: Breadcrumb[];  // Every 5 minutes

  // Time Calculations
  totalHours?: number;
  breakHours?: number;
  notes?: string;

  // Forms
  formsSubmitted: string[];  // Form IDs

  // Status
  status: 'Active' | 'Completed' | 'Disputed';
  approvedBy?: string;
  approvedAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// FORM SUBMISSION TYPES
// ============================================================================

export type FormType =
  | 'Safety'
  | 'Inspection'
  | 'Completion'
  | 'Incident'
  | 'Custom';

export interface FormField {
  fieldId: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'textarea' | 'file';
  value: any;
  required: boolean;
}

export interface Form {
  formId: string;
  userId: string;
  jobId: string;
  activityId?: string;

  formType: FormType;
  formName: string;
  fields: FormField[];

  // Submission Details
  submittedAt: Timestamp;
  location?: LocationData;
  photos: string[];  // URLs

  // Review
  status: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
}

// ============================================================================
// PIPELINE & ANALYTICS TYPES
// ============================================================================

export interface PipelineStage {
  stage: JobStage;
  count: number;
  totalValue: number;
  jobs: string[];  // Job IDs
}

export interface ConversionMetrics {
  requestToQuote: number;  // Percentage
  quoteToWon: number;
  wonToComplete: number;
  averageDaysInStage: {
    [key in JobStage]: number;
  };
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | 'job_update'
  | 'invoice_reminder'
  | 'clock_in_late'
  | 'form_submitted'
  | 'document_uploaded';

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface SystemSettings {
  companyName: string;
  companyLogo?: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  defaultQuoteFormat: QuoteFormat;
  autoReminderSettings: {
    enabled: boolean;
    daysBeforeDue: number;
    daysAfterDue: number;
  };
  locationTrackingInterval: number;  // Minutes
  geofenceRadius: number;  // Meters
}
