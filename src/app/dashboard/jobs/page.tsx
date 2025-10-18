'use client';

/**
 * Jobs List Page
 *
 * Displays all jobs with filtering, searching, and sorting capabilities.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getJobs, JobFilters } from '@/services/jobs.service';
import { Job, JobStage, JobUrgency } from '@/types';
import { format } from 'date-fns';

function JobsList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<JobStage | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<JobUrgency | 'all'>('all');

  useEffect(() => {
    loadJobs();
  }, [stageFilter, urgencyFilter]);

  async function loadJobs() {
    setLoading(true);
    try {
      const filters: JobFilters = {
        searchTerm: searchTerm || undefined,
      };

      if (stageFilter !== 'all') {
        filters.stage = stageFilter;
      }

      if (urgencyFilter !== 'all') {
        filters.urgency = urgencyFilter;
      }

      const fetchedJobs = await getJobs(filters);
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadJobs();
  }

  function getStageColor(stage: JobStage): string {
    const colors: Record<JobStage, string> = {
      Request: 'bg-gray-100 text-gray-800',
      Quote: 'bg-blue-100 text-blue-800',
      Won: 'bg-green-100 text-green-800',
      InProgress: 'bg-yellow-100 text-yellow-800',
      Complete: 'bg-purple-100 text-purple-800',
      Dispute: 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  }

  function getUrgencyColor(urgency: JobUrgency): string {
    const colors: Record<JobUrgency, string> = {
      Low: 'bg-green-50 text-green-700',
      Medium: 'bg-yellow-50 text-yellow-700',
      High: 'bg-orange-50 text-orange-700',
      Critical: 'bg-red-50 text-red-700',
    };
    return colors[urgency] || 'bg-gray-50 text-gray-700';
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>Manage and view all jobs in the system</CardDescription>
            </div>
            <Link href="/dashboard/jobs/new">
              <Button>+ New Job</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by job reference, location, or worksite..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select
              value={stageFilter}
              onValueChange={(value) => setStageFilter(value as JobStage | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Request">Request</SelectItem>
                <SelectItem value="Quote">Quote</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="InProgress">In Progress</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
                <SelectItem value="Dispute">Dispute</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={urgencyFilter}
              onValueChange={(value) => setUrgencyFilter(value as JobUrgency | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Jobs Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No jobs found</p>
              <p className="text-sm mt-2">Try adjusting your filters or create a new job</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Reference</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>PM</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow
                      key={job.jobId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/dashboard/jobs/${job.jobId}`)}
                    >
                      <TableCell className="font-medium">
                        {job.jobReferenceNumber}
                      </TableCell>
                      <TableCell>{job.mainServiceLocation}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                            job.jobStage
                          )}`}
                        >
                          {job.jobStage}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(
                            job.urgency
                          )}`}
                        >
                          {job.urgency}
                        </span>
                      </TableCell>
                      <TableCell>
                        {job.dates.estimatedStartDate
                          ? format(job.dates.estimatedStartDate.toDate(), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>{job.staff.projectManager || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/jobs/${job.jobId}`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Stats Summary */}
          {!loading && jobs.length > 0 && (
            <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
              <span>
                Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
              </span>
              <div className="flex gap-4">
                <span>
                  In Progress: {jobs.filter((j) => j.jobStage === 'InProgress').length}
                </span>
                <span>
                  Critical: {jobs.filter((j) => j.urgency === 'Critical').length}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute requiredDashboard="site_manager">
      <JobsList />
    </ProtectedRoute>
  );
}
