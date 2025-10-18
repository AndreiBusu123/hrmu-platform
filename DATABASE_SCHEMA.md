# HRMU Platform - Database Schema Documentation

This document provides a comprehensive overview of the Firebase Firestore database structure for the HRMU Platform.

## Table of Contents
1. [Collections Overview](#collections-overview)
2. [Detailed Schema](#detailed-schema)
3. [Relationships](#relationships)
4. [Security Rules](#security-rules)
5. [Indexes](#indexes)

---

## Collections Overview

| Collection | Purpose | Document Count (Est.) |
|------------|---------|----------------------|
| users | User accounts and authentication data | 50-200 |
| clients | Client company information | 100-500 |
| jobs | Job/project management | 1000+ |
| activities | Job activities and tasks | 5000+ |
| invoices | Billing and payment tracking | 2000+ |
| timesheets | Worker clock-in/out records | 10,000+ |
| forms | Field-submitted forms | 5000+ |
| notifications | User notifications | 10,000+ |
| settings | System configuration | 1 |

---

## Detailed Schema

### 1. Users Collection (`users/{uid}`)

Stores user account information and authentication data.

```typescript
{
  uid: string;                    // Firebase Auth UID
  email: string;                  // User email
  displayName?: string;           // Full name
  role: UserRole;                 // 'owner' | 'field_manager' | 'sales' | 'worker' | 'admin'
  permissions: string[];          // Permission array ['jobs:read', 'jobs:write', etc.]
  dashboardAccess: DashboardAccess[]; // ['site_manager', 'sales_marketing', 'both']
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  isActive: boolean;              // Account status
}
```

**Indexes Required:**
- `role` (ascending)
- `isActive` (ascending)
- `email` (ascending)

**Security:**
- Users can read their own document
- Only owners can create/delete users
- Users can update their own profile (limited fields)

---

### 2. Clients Collection (`clients/{clientId}`)

Stores client company information with multiple contact types.

```typescript
{
  clientId: string;               // Auto-generated
  name: string;                   // Company name

  // Contact Information
  invoicingContact: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  quotingContact: ClientContact;
  hsrContact: ClientContact;      // Health & Safety Representative
  siteContact: ClientContact;

  // Addresses
  addresses: Array<{
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    isNewWorksite?: boolean;
    showInGoogleMaps?: boolean;
    coordinates?: { lat: number; lng: number; };
  }>;

  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes Required:**
- `name` (ascending)
- `createdAt` (descending)

---

### 3. Jobs Collection (`jobs/{jobId}`)

Comprehensive job/project management with 40+ fields.

```typescript
{
  jobId: string;
  jobReferenceNumber: string;     // Auto or custom
  jobStage: JobStage;             // 'Request' | 'Quote' | 'Won' | 'InProgress' | 'Complete' | 'Dispute'
  mainServiceLocation: string;
  urgency: JobUrgency;            // 'Low' | 'Medium' | 'High' | 'Critical'

  // Client References
  clientForInvoicing: string;     // Client ID
  clientQuotingContact: string;
  clientHSR: string;
  clientSiteContact: string;
  clientJobPO?: string;           // Purchase Order

  // Worksite Details
  isNewWorksiteAddress: boolean;
  worksiteAddress: Address;
  showInGoogleMaps: boolean;
  workComments?: string;

  // Staff Assignments
  addedBy: string;                // User ID
  staff: {
    quoter?: string;
    projectManager?: string;
    teamLeader?: string;
    hsrSite?: string;
  };
  meetQuoterOnsite?: string;
  dateTimeToMeetClient?: Timestamp;
  quoteRequiredBy?: Timestamp;
  worksafeNoticeExpiryDate?: Timestamp;

  // Quote Information
  quote: {
    format: QuoteFormat;          // 'Standard' | 'Detailed' | 'Summary' | 'Custom'
    specialTerms?: string;
    scopeOfWorks?: string;
    scopeTextWithoutNumbering?: string;
    scopeTextWithNumbering?: string;
    additionalTerms?: string;
    remSQM?: number;
  };

  // Important Dates (13 date fields)
  dates: {
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
  };

  // Job Checklist (10 items)
  checklist: {
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
  };

  // Documents (20+ photos, 20+ documents)
  documents: JobDocument[];       // {documentId, name, url, type, uploadedBy, uploadedAt}
  photos: JobDocument[];

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes Required:**
- `jobStage` (ascending) + `createdAt` (descending)
- `clientForInvoicing` (ascending) + `jobStage` (ascending)
- `staff.projectManager` (ascending) + `jobStage` (ascending)
- `dates.estimatedStartDate` (ascending)
- `urgency` (ascending)

---

### 4. Activities Collection (`activities/{activityId}`)

Job activities with 5 types and task management.

```typescript
{
  activityId: string;
  jobId: string;                  // Reference to parent job
  type: ActivityType;             // 'Alterations' | 'DayLabour' | 'Delivery' | 'DismantleDayworks' | 'DismantleScaffold'
  name: string;
  description?: string;

  // Scheduling
  staff: string[];                // User IDs
  startDate: Timestamp;
  endDate?: Timestamp;

  // Work Management
  tasks: Array<{
    taskId: string;
    description: string;
    assignedTo?: string[];
    completed: boolean;
    completedAt?: Timestamp;
    estimatedHours?: number;
  }>;

  checklists: Array<{
    checklistId: string;
    name: string;
    items: Array<{
      itemId: string;
      description: string;
      completed: boolean;
      completedBy?: string;
      completedAt?: Timestamp;
    }>;
  }>;

  workNotes: string;

  // On-site Tracking
  onSiteStaff: string[];          // Currently on-site
  timeAllocations: Array<{
    userId: string;
    allocatedHours: number;
    actualHours?: number;
  }>;

  // Status
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  documents: JobDocument[];

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes Required:**
- `jobId` (ascending) + `status` (ascending)
- `type` (ascending) + `status` (ascending)
- `startDate` (ascending)

---

### 5. Invoices Collection (`invoices/{invoiceId}`)

Billing and payment tracking with automation.

```typescript
{
  invoiceId: string;
  invoiceNumber: string;          // Auto-generated
  jobId: string;
  clientId: string;

  // Line Items
  lineItems: Array<{
    lineItemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate?: number;
  }>;

  subtotal: number;
  tax: number;
  totalAmount: number;

  // Status & Dates
  status: InvoiceStatus;          // 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue' | 'Disputed'
  sentDate?: Timestamp;
  dueDate?: Timestamp;
  paidDate?: Timestamp;

  // Automated Reminders
  reminders: {
    autoEnabled: boolean;
    lastSent?: Timestamp;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    nextReminderDate?: Timestamp;
  };

  // Communication
  pdfUrl?: string;
  emailHistory: Array<{
    emailId: string;
    sentTo: string;
    sentAt: Timestamp;
    subject: string;
    opened?: boolean;
    openedAt?: Timestamp;
  }>;

  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes Required:**
- `status` (ascending) + `dueDate` (ascending)
- `clientId` (ascending) + `status` (ascending)
- `jobId` (ascending)

---

### 6. Timesheets Collection (`timesheets/{timesheetId}`)

Worker clock-in/out with GPS tracking.

```typescript
{
  timesheetId: string;
  userId: string;
  jobId: string;
  activityId?: string;

  // Clock Events
  clockIn: {
    timestamp: Timestamp;
    location: { lat: number; lng: number; accuracy?: number; };
    photo?: string;               // URL
    deviceInfo?: {
      platform: 'ios' | 'android';
      deviceId: string;
      appVersion: string;
    };
  };

  clockOut?: ClockEvent;

  // Location Tracking (every 5 minutes)
  breadcrumbs: Array<{
    timestamp: Timestamp;
    location: LocationData;
    batteryLevel?: number;
  }>;

  // Time Calculations
  totalHours?: number;
  breakHours?: number;
  notes?: string;

  // Forms
  formsSubmitted: string[];       // Form IDs

  // Approval
  status: 'Active' | 'Completed' | 'Disputed';
  approvedBy?: string;
  approvedAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes Required:**
- `userId` (ascending) + `createdAt` (descending)
- `jobId` (ascending) + `status` (ascending)
- `status` (ascending) + `createdAt` (descending)

---

### 7. Forms Collection (`forms/{formId}`)

Field-submitted forms with photos and location.

```typescript
{
  formId: string;
  userId: string;
  jobId: string;
  activityId?: string;

  formType: FormType;             // 'Safety' | 'Inspection' | 'Completion' | 'Incident' | 'Custom'
  formName: string;

  fields: Array<{
    fieldId: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'textarea' | 'file';
    value: any;
    required: boolean;
  }>;

  // Submission
  submittedAt: Timestamp;
  location?: LocationData;
  photos: string[];               // URLs

  // Review
  status: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
}
```

**Indexes Required:**
- `jobId` (ascending) + `status` (ascending)
- `userId` (ascending) + `submittedAt` (descending)
- `formType` (ascending) + `status` (ascending)

---

## Relationships

```
Client (1) ──── (N) Jobs
Job (1) ──── (N) Activities
Job (1) ──── (N) Invoices
Job (1) ──── (N) Timesheets
Job (1) ──── (N) Forms
Activity (1) ──── (N) Timesheets
Activity (1) ──── (N) Forms
User (1) ──── (N) Timesheets
User (1) ──── (N) Forms
```

---

## Security Rules

### Basic Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isOwner() {
      return isAuthenticated() && getUserRole() == 'owner';
    }

    function hasPermission(permission) {
      let userData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userData.permissions.hasAny(['*', permission]);
    }

    // Users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner();
      allow update: if request.auth.uid == userId || isOwner();
      allow delete: if isOwner();
    }

    // Clients
    match /clients/{clientId} {
      allow read: if isAuthenticated();
      allow write: if hasPermission('clients:write') || isOwner();
    }

    // Jobs
    match /jobs/{jobId} {
      allow read: if isAuthenticated();
      allow create: if hasPermission('jobs:write');
      allow update, delete: if hasPermission('jobs:write') ||
                               resource.data.createdBy == request.auth.uid ||
                               isOwner();
    }

    // Similar rules for other collections...
  }
}
```

---

## Indexes

### Composite Indexes Required

1. **Jobs Collection:**
   - `jobStage` (ASC) + `createdAt` (DESC)
   - `clientForInvoicing` (ASC) + `jobStage` (ASC)
   - `staff.projectManager` (ASC) + `jobStage` (ASC)

2. **Activities Collection:**
   - `jobId` (ASC) + `status` (ASC)
   - `type` (ASC) + `status` (ASC)

3. **Invoices Collection:**
   - `status` (ASC) + `dueDate` (ASC)
   - `clientId` (ASC) + `status` (ASC)

4. **Timesheets Collection:**
   - `userId` (ASC) + `createdAt` (DESC)
   - `jobId` (ASC) + `status` (ASC)

5. **Forms Collection:**
   - `jobId` (ASC) + `status` (ASC)
   - `formType` (ASC) + `status` (ASC)

---

## Firebase Realtime Database Structure

For real-time location tracking (separate from Firestore):

```
{
  "locations": {
    "{userId}": {
      "current": {
        "lat": 0.0,
        "lng": 0.0,
        "timestamp": 0,
        "accuracy": 0
      },
      "breadcrumbs": {
        "{timestamp}": {
          "lat": 0.0,
          "lng": 0.0,
          "timestamp": 0
        }
      }
    }
  }
}
```

---

## Notes

1. **Document Size Limits**: Firestore documents are limited to 1MB. For jobs with 20+ photos/documents, store only URLs/metadata in the document.

2. **Subcollections**: Consider using subcollections for:
   - Job documents: `jobs/{jobId}/documents/{docId}`
   - Activity tasks: `activities/{activityId}/tasks/{taskId}`

3. **Batch Operations**: Use batched writes for related updates (e.g., creating job + initial activity).

4. **Real-time Listeners**: Limit real-time listeners to active views only (current jobs, today's timesheets).

5. **Offline Support**: Enable persistence for mobile apps to support offline operation.

---

*Last Updated: 2025-10-19*
