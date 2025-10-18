/**
 * Jobs Service
 *
 * Handles all Firestore operations for the Jobs collection.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Job, JobStage, JobUrgency } from '@/types';

const JOBS_COLLECTION = 'jobs';

/**
 * Generate a unique job reference number
 * Format: JOB-YYYYMMDD-XXXX (e.g., JOB-20251019-0001)
 */
export async function generateJobReferenceNumber(): Promise<string> {
  const db = getFirebaseFirestore();
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  // Get today's jobs to determine the next sequence number
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const q = query(
    collection(db, JOBS_COLLECTION),
    where('createdAt', '>=', Timestamp.fromDate(todayStart)),
    where('createdAt', '<=', Timestamp.fromDate(todayEnd)),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  let sequence = 1;

  if (!snapshot.empty) {
    const lastJob = snapshot.docs[0].data();
    const lastRef = lastJob.jobReferenceNumber;
    if (lastRef && lastRef.startsWith(`JOB-${dateStr}`)) {
      const lastSeq = parseInt(lastRef.split('-')[2], 10);
      sequence = lastSeq + 1;
    }
  }

  return `JOB-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Create a new job
 */
export async function createJob(
  jobData: Omit<Job, 'jobId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> {
  const db = getFirebaseFirestore();

  // Generate job reference number if not provided
  if (!jobData.jobReferenceNumber) {
    jobData.jobReferenceNumber = await generateJobReferenceNumber();
  }

  const newJob: Omit<Job, 'jobId'> = {
    ...jobData,
    createdBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, JOBS_COLLECTION), newJob);

  // Update the document with its own ID
  await updateDoc(docRef, { jobId: docRef.id });

  return docRef.id;
}

/**
 * Get a single job by ID
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, JOBS_COLLECTION, jobId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { ...docSnap.data(), jobId: docSnap.id } as Job;
  }

  return null;
}

/**
 * Update a job
 */
export async function updateJob(
  jobId: string,
  updates: Partial<Job>
): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, JOBS_COLLECTION, jobId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, JOBS_COLLECTION, jobId);
  await deleteDoc(docRef);
}

/**
 * Job filter options
 */
export interface JobFilters {
  stage?: JobStage | JobStage[];
  urgency?: JobUrgency;
  clientId?: string;
  projectManager?: string;
  teamLeader?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

/**
 * Get jobs with filters
 */
export async function getJobs(filters?: JobFilters): Promise<Job[]> {
  const db = getFirebaseFirestore();
  const constraints: QueryConstraint[] = [];

  // Apply filters
  if (filters?.stage) {
    if (Array.isArray(filters.stage)) {
      constraints.push(where('jobStage', 'in', filters.stage));
    } else {
      constraints.push(where('jobStage', '==', filters.stage));
    }
  }

  if (filters?.urgency) {
    constraints.push(where('urgency', '==', filters.urgency));
  }

  if (filters?.clientId) {
    constraints.push(where('clientForInvoicing', '==', filters.clientId));
  }

  if (filters?.projectManager) {
    constraints.push(where('staff.projectManager', '==', filters.projectManager));
  }

  if (filters?.teamLeader) {
    constraints.push(where('staff.teamLeader', '==', filters.teamLeader));
  }

  if (filters?.startDate) {
    constraints.push(
      where('dates.estimatedStartDate', '>=', Timestamp.fromDate(filters.startDate))
    );
  }

  if (filters?.endDate) {
    constraints.push(
      where('dates.estimatedEndDate', '<=', Timestamp.fromDate(filters.endDate))
    );
  }

  // Default ordering
  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, JOBS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let jobs = snapshot.docs.map(doc => ({
    ...doc.data(),
    jobId: doc.id,
  })) as Job[];

  // Client-side search filtering (Firestore doesn't support full-text search)
  if (filters?.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    jobs = jobs.filter(job =>
      job.jobReferenceNumber.toLowerCase().includes(searchLower) ||
      job.mainServiceLocation.toLowerCase().includes(searchLower) ||
      job.worksiteAddress.street?.toLowerCase().includes(searchLower) ||
      job.workComments?.toLowerCase().includes(searchLower)
    );
  }

  return jobs;
}

/**
 * Get jobs by stage for pipeline view
 */
export async function getJobsByStage(): Promise<Record<JobStage, Job[]>> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, JOBS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const jobs = snapshot.docs.map(doc => ({
    ...doc.data(),
    jobId: doc.id,
  })) as Job[];

  // Group by stage
  const grouped: Record<JobStage, Job[]> = {
    Request: [],
    Quote: [],
    Won: [],
    InProgress: [],
    Complete: [],
    Dispute: [],
  };

  jobs.forEach(job => {
    if (grouped[job.jobStage]) {
      grouped[job.jobStage].push(job);
    }
  });

  return grouped;
}

/**
 * Update job stage
 */
export async function updateJobStage(
  jobId: string,
  newStage: JobStage
): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, JOBS_COLLECTION, jobId);

  const updates: Partial<Job> = {
    jobStage: newStage,
    updatedAt: Timestamp.now(),
  };

  // Update stage-specific dates
  const now = Timestamp.now();
  if (newStage === 'Won' && !updates.dates) {
    updates.dates = { ...updates.dates, jobWonDate: now } as any;
  } else if (newStage === 'Complete') {
    updates.dates = { ...updates.dates, completedDate: now } as any;
  }

  await updateDoc(docRef, updates as DocumentData);
}

/**
 * Get jobs for calendar view
 */
export async function getJobsForCalendar(
  startDate: Date,
  endDate: Date
): Promise<Job[]> {
  const db = getFirebaseFirestore();

  const q = query(
    collection(db, JOBS_COLLECTION),
    where('dates.estimatedStartDate', '>=', Timestamp.fromDate(startDate)),
    where('dates.estimatedStartDate', '<=', Timestamp.fromDate(endDate)),
    orderBy('dates.estimatedStartDate', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    ...doc.data(),
    jobId: doc.id,
  })) as Job[];
}

/**
 * Get job statistics
 */
export async function getJobStatistics(): Promise<{
  total: number;
  byStage: Record<JobStage, number>;
  byUrgency: Record<JobUrgency, number>;
}> {
  const jobs = await getJobs();

  const stats = {
    total: jobs.length,
    byStage: {
      Request: 0,
      Quote: 0,
      Won: 0,
      InProgress: 0,
      Complete: 0,
      Dispute: 0,
    } as Record<JobStage, number>,
    byUrgency: {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    } as Record<JobUrgency, number>,
  };

  jobs.forEach(job => {
    stats.byStage[job.jobStage]++;
    stats.byUrgency[job.urgency]++;
  });

  return stats;
}
