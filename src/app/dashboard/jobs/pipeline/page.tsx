'use client';

/**
 * Job Pipeline - Kanban Board View
 *
 * Visual drag-and-drop board for managing job stages.
 * Displays jobs organized by their current stage with the ability
 * to drag jobs between stages to update their status.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getJobsByStage, updateJobStage } from '@/services/jobs.service';
import { Job, JobStage } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

// Job card component
function JobCard({ job, isDragging = false }: { job: Job; isDragging?: boolean }) {
  const router = useRouter();

  const getUrgencyColor = (urgency: string): string => {
    const colors: Record<string, string> = {
      Low: 'border-l-4 border-l-green-500',
      Medium: 'border-l-4 border-l-yellow-500',
      High: 'border-l-4 border-l-orange-500',
      Critical: 'border-l-4 border-l-red-500',
    };
    return colors[urgency] || 'border-l-4 border-l-gray-500';
  };

  return (
    <div
      className={`bg-white rounded-lg p-3 mb-2 shadow-sm border hover:shadow-md transition-shadow cursor-move ${getUrgencyColor(
        job.urgency
      )} ${isDragging ? 'opacity-50' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/jobs/${job.jobId}`);
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm">{job.jobReferenceNumber}</h4>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            job.urgency === 'Critical'
              ? 'bg-red-100 text-red-700'
              : job.urgency === 'High'
              ? 'bg-orange-100 text-orange-700'
              : job.urgency === 'Medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {job.urgency}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{job.mainServiceLocation}</p>
      <div className="text-xs text-gray-500 space-y-1">
        {job.staff.projectManager && (
          <div className="flex items-center gap-1">
            <span className="font-medium">PM:</span> {job.staff.projectManager}
          </div>
        )}
        {job.dates.estimatedStartDate && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Start:</span>{' '}
            {format(job.dates.estimatedStartDate.toDate(), 'MMM d')}
          </div>
        )}
      </div>
    </div>
  );
}

// Droppable column component
function KanbanColumn({
  stage,
  jobs,
  count,
}: {
  stage: JobStage;
  jobs: Job[];
  count: number;
}) {
  const getStageColor = (stage: JobStage): string => {
    const colors: Record<JobStage, string> = {
      Request: 'bg-gray-50 border-gray-200',
      Quote: 'bg-blue-50 border-blue-200',
      Won: 'bg-green-50 border-green-200',
      InProgress: 'bg-yellow-50 border-yellow-200',
      Complete: 'bg-purple-50 border-purple-200',
      Dispute: 'bg-red-50 border-red-200',
    };
    return colors[stage];
  };

  const getStageTextColor = (stage: JobStage): string => {
    const colors: Record<JobStage, string> = {
      Request: 'text-gray-700',
      Quote: 'text-blue-700',
      Won: 'text-green-700',
      InProgress: 'text-yellow-700',
      Complete: 'text-purple-700',
      Dispute: 'text-red-700',
    };
    return colors[stage];
  };

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Column Header */}
      <div className={`p-3 rounded-t-lg border-2 border-b-0 ${getStageColor(stage)}`}>
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold ${getStageTextColor(stage)}`}>{stage}</h3>
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStageColor(
              stage
            )} ${getStageTextColor(stage)}`}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        id={stage}
        className={`flex-1 p-2 border-2 border-t-0 rounded-b-lg ${getStageColor(
          stage
        )} min-h-[500px]`}
      >
        {jobs.map((job) => (
          <div key={job.jobId} id={job.jobId}>
            <JobCard job={job} />
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No jobs in this stage
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineBoard() {
  const router = useRouter();
  const [jobsByStage, setJobsByStage] = useState<Record<JobStage, Job[]>>({
    Request: [],
    Quote: [],
    Won: [],
    InProgress: [],
    Complete: [],
    Dispute: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const jobs = await getJobsByStage();
      setJobsByStage(jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const jobId = event.active.id as string;
    // Find the job in all stages
    for (const stage in jobsByStage) {
      const job = jobsByStage[stage as JobStage].find((j) => j.jobId === jobId);
      if (job) {
        setActiveJob(job);
        break;
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const jobId = active.id as string;
    const newStage = over.id as JobStage;

    // Find current job and stage
    let currentJob: Job | null = null;
    let currentStage: JobStage | null = null;

    for (const stage in jobsByStage) {
      const job = jobsByStage[stage as JobStage].find((j) => j.jobId === jobId);
      if (job) {
        currentJob = job;
        currentStage = stage as JobStage;
        break;
      }
    }

    if (!currentJob || !currentStage || currentStage === newStage) return;

    // Optimistic update
    const updatedJobsByStage = { ...jobsByStage };
    updatedJobsByStage[currentStage] = updatedJobsByStage[currentStage].filter(
      (j) => j.jobId !== jobId
    );
    updatedJobsByStage[newStage] = [
      ...updatedJobsByStage[newStage],
      { ...currentJob, jobStage: newStage },
    ];
    setJobsByStage(updatedJobsByStage);

    // Update in Firestore
    try {
      await updateJobStage(jobId, newStage);
    } catch (error) {
      console.error('Failed to update job stage:', error);
      // Revert on error
      loadJobs();
    }
  }

  const totalJobs = Object.values(jobsByStage).reduce((sum, jobs) => sum + jobs.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Job Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Drag and drop jobs between stages to update their status
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/jobs">
            <Button variant="outline">List View</Button>
          </Link>
          <Link href="/dashboard/jobs/new">
            <Button>+ New Job</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
              <p className="text-sm text-gray-500">Total Jobs</p>
            </div>
            {(['Request', 'Quote', 'Won', 'InProgress', 'Complete', 'Dispute'] as JobStage[]).map(
              (stage) => (
                <div key={stage}>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobsByStage[stage].length}
                  </p>
                  <p className="text-sm text-gray-500">{stage}</p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-4">
          {(['Request', 'Quote', 'Won', 'InProgress', 'Complete', 'Dispute'] as JobStage[]).map(
            (stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                jobs={jobsByStage[stage]}
                count={jobsByStage[stage].length}
              />
            )
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeJob ? <JobCard job={activeJob} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Click and drag any job card to move it between stages. Click on
          a card to view full details.
        </p>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <ProtectedRoute requiredDashboard="site_manager">
      <PipelineBoard />
    </ProtectedRoute>
  );
}
