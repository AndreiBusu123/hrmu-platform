'use client';

/**
 * Job Detail Page
 *
 * Displays comprehensive information about a specific job.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getJob, updateJobStage } from '@/services/jobs.service';
import { Job, JobStage } from '@/types';
import { format } from 'date-fns';

function JobDetail() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJob();
  }, [jobId]);

  async function loadJob() {
    setLoading(true);
    try {
      const fetchedJob = await getJob(jobId);
      if (fetchedJob) {
        setJob(fetchedJob);
      } else {
        setError('Job not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }

  async function handleStageChange(newStage: JobStage) {
    if (!job) return;

    try {
      await updateJobStage(jobId, newStage);
      setJob({ ...job, jobStage: newStage });
    } catch (err: any) {
      alert('Failed to update job stage: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-500">{error || 'Job not found'}</p>
            <Link href="/dashboard/jobs">
              <Button className="mt-4">Back to Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStageColor = (stage: JobStage): string => {
    const colors: Record<JobStage, string> = {
      Request: 'bg-gray-100 text-gray-800',
      Quote: 'bg-blue-100 text-blue-800',
      Won: 'bg-green-100 text-green-800',
      InProgress: 'bg-yellow-100 text-yellow-800',
      Complete: 'bg-purple-100 text-purple-800',
      Dispute: 'bg-red-100 text-red-800',
    };
    return colors[stage];
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{job.jobReferenceNumber}</h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageColor(
                job.jobStage
              )}`}
            >
              {job.jobStage}
            </span>
          </div>
          <p className="text-gray-600">{job.mainServiceLocation}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/jobs/${jobId}/edit`}>
            <Button variant="outline">Edit Job</Button>
          </Link>
          <Link href="/dashboard/jobs">
            <Button variant="outline">Back to Jobs</Button>
          </Link>
        </div>
      </div>

      {/* Stage Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Change Job Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {(['Request', 'Quote', 'Won', 'InProgress', 'Complete', 'Dispute'] as JobStage[]).map(
              (stage) => (
                <Button
                  key={stage}
                  variant={job.jobStage === stage ? 'default' : 'outline'}
                  onClick={() => handleStageChange(stage)}
                  size="sm"
                >
                  {stage}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Details Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="client">Client</TabsTrigger>
          <TabsTrigger value="worksite">Worksite</TabsTrigger>
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="dates">Dates</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="files">
            Files ({job.photos.length + job.documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Job Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Job Reference</p>
                  <p className="text-lg">{job.jobReferenceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Main Service Location</p>
                  <p className="text-lg">{job.mainServiceLocation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Urgency</p>
                  <p className="text-lg">{job.urgency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Stage</p>
                  <p className="text-lg">{job.jobStage}</p>
                </div>
                {job.clientJobPO && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Purchase Order</p>
                    <p className="text-lg">{job.clientJobPO}</p>
                  </div>
                )}
                {job.workComments && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Work Comments</p>
                    <p className="text-base mt-1">{job.workComments}</p>
                  </div>
                )}
              </div>

              {/* Staff Assignments */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Staff Assignments</h3>
                <div className="grid grid-cols-2 gap-4">
                  {job.staff.quoter && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Quoter</p>
                      <p>{job.staff.quoter}</p>
                    </div>
                  )}
                  {job.staff.projectManager && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Project Manager</p>
                      <p>{job.staff.projectManager}</p>
                    </div>
                  )}
                  {job.staff.teamLeader && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Team Leader</p>
                      <p>{job.staff.teamLeader}</p>
                    </div>
                  )}
                  {job.staff.hsrSite && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">HSR Site</p>
                      <p>{job.staff.hsrSite}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Tab */}
        <TabsContent value="client">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Client for Invoicing</p>
                  <p>{job.clientForInvoicing}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Quoting Contact</p>
                  <p>{job.clientQuotingContact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Health & Safety Rep</p>
                  <p>{job.clientHSR}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Site Contact</p>
                  <p>{job.clientSiteContact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Worksite Tab */}
        <TabsContent value="worksite">
          <Card>
            <CardHeader>
              <CardTitle>Worksite Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
                <p>{job.worksiteAddress.street}</p>
                <p>
                  {job.worksiteAddress.city}
                  {job.worksiteAddress.state && `, ${job.worksiteAddress.state}`}
                  {job.worksiteAddress.postalCode && ` ${job.worksiteAddress.postalCode}`}
                </p>
                <p>{job.worksiteAddress.country}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">New Worksite</p>
                  <p>{job.isNewWorksiteAddress ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Show in Google Maps</p>
                  <p>{job.showInGoogleMaps ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quote Tab */}
        <TabsContent value="quote">
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Quote Format</p>
                  <p>{job.quote.format}</p>
                </div>
                {job.quote.remSQM && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rem SQM</p>
                    <p>{job.quote.remSQM}</p>
                  </div>
                )}
              </div>

              {job.quote.specialTerms && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Special Terms</p>
                  <p className="whitespace-pre-wrap">{job.quote.specialTerms}</p>
                </div>
              )}

              {job.quote.scopeOfWorks && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Scope of Works</p>
                  <p className="whitespace-pre-wrap">{job.quote.scopeOfWorks}</p>
                </div>
              )}

              {job.quote.additionalTerms && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Additional Terms</p>
                  <p className="whitespace-pre-wrap">{job.quote.additionalTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dates Tab */}
        <TabsContent value="dates">
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {job.dates.expiryDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                    <p>{format(job.dates.expiryDate.toDate(), 'PPP')}</p>
                  </div>
                )}
                {job.dates.estimatedStartDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estimated Start</p>
                    <p>{format(job.dates.estimatedStartDate.toDate(), 'PPP')}</p>
                  </div>
                )}
                {job.dates.estimatedWeeks && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estimated Duration</p>
                    <p>{job.dates.estimatedWeeks} weeks</p>
                  </div>
                )}
                {job.dates.estimatedEndDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estimated End</p>
                    <p>{format(job.dates.estimatedEndDate.toDate(), 'PPP')}</p>
                  </div>
                )}
                {job.dates.followupDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Followup Date</p>
                    <p>{format(job.dates.followupDate.toDate(), 'PPP')}</p>
                  </div>
                )}
                {job.dates.jobWonDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Job Won</p>
                    <p>{format(job.dates.jobWonDate.toDate(), 'PPP')}</p>
                  </div>
                )}
                {job.dates.completedDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p>{format(job.dates.completedDate.toDate(), 'PPP')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Job Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { key: 'weeklyInspection', label: 'Weekly Inspection' },
                  { key: 'monthlyInspection', label: 'Monthly Inspection' },
                  { key: 'worksafeNotifiableInspection', label: 'Worksafe Notifiable Inspection (over 5m)' },
                  { key: 'electricalInspectionPowerlines', label: 'Electrical Inspection for Powerlines' },
                  { key: 'electricalInspectionStreetCables', label: 'Electrical Inspection for Street Cables' },
                  { key: 'produceTrafficPlan', label: 'Produce Traffic Plan' },
                  { key: 'orderConsultingEngineering', label: 'Order Consulting Engineering Services' },
                  { key: 'orderPS1Engineering', label: 'Order PS1 Engineering Services' },
                  { key: 'orderPS4Engineering', label: 'Order PS4 Engineering Services' },
                  { key: 'reviewedByOperationsManagement', label: 'Reviewed by Operations Management' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={job.checklist[item.key as keyof typeof job.checklist]}
                      disabled
                      className="h-4 w-4"
                    />
                    <label className={job.checklist[item.key as keyof typeof job.checklist] ? 'font-medium' : ''}>
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <div className="space-y-6">
            {/* Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle>Photos ({job.photos.length}/20)</CardTitle>
                <CardDescription>Job site photos and images</CardDescription>
              </CardHeader>
              <CardContent>
                {job.photos.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No photos uploaded</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {job.photos.map((photo) => (
                      <div key={photo.documentId} className="group relative">
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-48 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                              View Full Size
                            </span>
                          </div>
                        </a>
                        <p className="text-xs text-gray-600 mt-2 truncate">{photo.name}</p>
                        {photo.uploadedAt && (
                          <p className="text-xs text-gray-400">
                            {new Date(photo.uploadedAt.toDate()).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle>Documents ({job.documents.length}/20)</CardTitle>
                <CardDescription>Project documents and files</CardDescription>
              </CardHeader>
              <CardContent>
                {job.documents.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No documents uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {job.documents.map((doc) => (
                      <div
                        key={doc.documentId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-2xl flex-shrink-0">
                            {doc.mimeType?.includes('pdf')
                              ? '📄'
                              : doc.mimeType?.includes('word')
                              ? '📝'
                              : doc.mimeType?.includes('excel')
                              ? '📊'
                              : '📎'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.name}</p>
                            <div className="flex gap-3 text-xs text-gray-500">
                              {doc.size && <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>}
                              {doc.uploadedAt && (
                                <span>
                                  {new Date(doc.uploadedAt.toDate()).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3"
                        >
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created By</p>
              <p>{job.createdBy}</p>
            </div>
            <div>
              <p className="text-gray-500">Created At</p>
              <p>{format(job.createdAt.toDate(), 'PPP p')}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p>{format(job.updatedAt.toDate(), 'PPP p')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <ProtectedRoute requiredDashboard="site_manager">
      <JobDetail />
    </ProtectedRoute>
  );
}
