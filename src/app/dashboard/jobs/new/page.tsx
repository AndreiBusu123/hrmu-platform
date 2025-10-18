'use client';

/**
 * New Job Creation Page
 *
 * Comprehensive form for creating jobs with all 40+ fields
 * organized into logical tabs for better UX.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { createJob } from '@/services/jobs.service';
import { getClientsForSelect } from '@/services/clients.service';
import { Job, JobStage, JobUrgency, QuoteFormat } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface JobFormData {
  // Basic Info
  jobReferenceNumber?: string;
  jobStage: JobStage;
  mainServiceLocation: string;
  urgency: JobUrgency;

  // Client Info
  clientForInvoicing: string;
  clientQuotingContact: string;
  clientHSR: string;
  clientSiteContact: string;
  clientJobPO?: string;

  // Worksite
  isNewWorksiteAddress: boolean;
  worksiteStreet: string;
  worksiteCity: string;
  worksiteState?: string;
  worksitePostalCode?: string;
  worksiteCountry: string;
  showInGoogleMaps: boolean;
  workComments?: string;

  // Staff
  staffQuoter?: string;
  staffProjectManager?: string;
  staffTeamLeader?: string;
  staffHSR?: string;
  meetQuoterOnsite?: string;
  quoteRequiredBy?: string;
  worksafeNoticeExpiryDate?: string;

  // Quote
  quoteFormat: QuoteFormat;
  quoteSpecialTerms?: string;
  scopeOfWorks?: string;
  scopeTextWithoutNumbering?: string;
  scopeTextWithNumbering?: string;
  additionalTerms?: string;
  remSQM?: number;

  // Dates
  expiryDate?: string;
  estimatedStartDate?: string;
  estimatedWeeks?: number;
  estimatedEndDate?: string;
  followupDate?: string;

  // Checklist
  weeklyInspection: boolean;
  monthlyInspection: boolean;
  worksafeNotifiableInspection: boolean;
  electricalInspectionPowerlines: boolean;
  electricalInspectionStreetCables: boolean;
  produceTrafficPlan: boolean;
  orderConsultingEngineering: boolean;
  orderPS1Engineering: boolean;
  orderPS4Engineering: boolean;
  reviewedByOperationsManagement: boolean;
}

function NewJobForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Array<{ value: string; label: string }>>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<JobFormData>({
    defaultValues: {
      jobStage: 'Request',
      urgency: 'Medium',
      isNewWorksiteAddress: false,
      showInGoogleMaps: true,
      worksiteCountry: 'New Zealand',
      quoteFormat: 'Standard',
      weeklyInspection: false,
      monthlyInspection: false,
      worksafeNotifiableInspection: false,
      electricalInspectionPowerlines: false,
      electricalInspectionStreetCables: false,
      produceTrafficPlan: false,
      orderConsultingEngineering: false,
      orderPS1Engineering: false,
      orderPS4Engineering: false,
      reviewedByOperationsManagement: false,
    },
  });

  // Load clients on mount
  useEffect(() => {
    async function loadClients() {
      try {
        const clientsList = await getClientsForSelect();
        setClients(clientsList);
      } catch (err) {
        console.error('Failed to load clients:', err);
      }
    }
    loadClients();
  }, []);

  const onSubmit = async (data: JobFormData) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Convert form data to Job format
      const jobData: Omit<Job, 'jobId' | 'createdAt' | 'updatedAt'> = {
        jobReferenceNumber: data.jobReferenceNumber || '',
        jobStage: data.jobStage,
        mainServiceLocation: data.mainServiceLocation,
        urgency: data.urgency,

        clientForInvoicing: data.clientForInvoicing,
        clientQuotingContact: data.clientQuotingContact,
        clientHSR: data.clientHSR,
        clientSiteContact: data.clientSiteContact,
        clientJobPO: data.clientJobPO,

        isNewWorksiteAddress: data.isNewWorksiteAddress,
        worksiteAddress: {
          street: data.worksiteStreet,
          city: data.worksiteCity,
          state: data.worksiteState,
          postalCode: data.worksitePostalCode,
          country: data.worksiteCountry,
          isNewWorksite: data.isNewWorksiteAddress,
          showInGoogleMaps: data.showInGoogleMaps,
        },
        showInGoogleMaps: data.showInGoogleMaps,
        workComments: data.workComments,

        addedBy: user.uid,
        staff: {
          quoter: data.staffQuoter,
          projectManager: data.staffProjectManager,
          teamLeader: data.staffTeamLeader,
          hsrSite: data.staffHSR,
        },
        meetQuoterOnsite: data.meetQuoterOnsite,
        quoteRequiredBy: data.quoteRequiredBy ? Timestamp.fromDate(new Date(data.quoteRequiredBy)) : undefined,
        worksafeNoticeExpiryDate: data.worksafeNoticeExpiryDate ? Timestamp.fromDate(new Date(data.worksafeNoticeExpiryDate)) : undefined,

        quote: {
          format: data.quoteFormat,
          specialTerms: data.quoteSpecialTerms,
          scopeOfWorks: data.scopeOfWorks,
          scopeTextWithoutNumbering: data.scopeTextWithoutNumbering,
          scopeTextWithNumbering: data.scopeTextWithNumbering,
          additionalTerms: data.additionalTerms,
          remSQM: data.remSQM,
        },

        dates: {
          expiryDate: data.expiryDate ? Timestamp.fromDate(new Date(data.expiryDate)) : undefined,
          estimatedStartDate: data.estimatedStartDate ? Timestamp.fromDate(new Date(data.estimatedStartDate)) : undefined,
          estimatedWeeks: data.estimatedWeeks,
          estimatedEndDate: data.estimatedEndDate ? Timestamp.fromDate(new Date(data.estimatedEndDate)) : undefined,
          followupDate: data.followupDate ? Timestamp.fromDate(new Date(data.followupDate)) : undefined,
        },

        checklist: {
          weeklyInspection: data.weeklyInspection,
          monthlyInspection: data.monthlyInspection,
          worksafeNotifiableInspection: data.worksafeNotifiableInspection,
          electricalInspectionPowerlines: data.electricalInspectionPowerlines,
          electricalInspectionStreetCables: data.electricalInspectionStreetCables,
          produceTrafficPlan: data.produceTrafficPlan,
          orderConsultingEngineering: data.orderConsultingEngineering,
          orderPS1Engineering: data.orderPS1Engineering,
          orderPS4Engineering: data.orderPS4Engineering,
          reviewedByOperationsManagement: data.reviewedByOperationsManagement,
        },

        documents: [],
        photos: [],
        createdBy: user.uid,
      };

      const jobId = await createJob(jobData, user.uid);
      router.push(`/dashboard/jobs/${jobId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>
            Fill in the job details below. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="worksite">Worksite</TabsTrigger>
                <TabsTrigger value="quote">Quote</TabsTrigger>
                <TabsTrigger value="dates">Dates</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobReferenceNumber">
                      Job Reference Number
                      <span className="text-xs text-gray-500 ml-2">(Auto-generated if left blank)</span>
                    </Label>
                    <Input
                      id="jobReferenceNumber"
                      {...register('jobReferenceNumber')}
                      placeholder="JOB-20251019-0001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobStage">Job Stage *</Label>
                    <Select onValueChange={(value) => setValue('jobStage', value as JobStage)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Request">Request</SelectItem>
                        <SelectItem value="Quote">Quote</SelectItem>
                        <SelectItem value="Won">Won</SelectItem>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                        <SelectItem value="Dispute">Dispute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mainServiceLocation">Main Service Location *</Label>
                    <Input
                      id="mainServiceLocation"
                      {...register('mainServiceLocation', { required: true })}
                      placeholder="Auckland CBD"
                    />
                    {errors.mainServiceLocation && (
                      <span className="text-xs text-red-500">This field is required</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency">Job Urgency *</Label>
                    <Select onValueChange={(value) => setValue('urgency', value as JobUrgency)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Client Tab */}
              <TabsContent value="client" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientForInvoicing">Client for Invoicing *</Label>
                    <Select onValueChange={(value) => setValue('clientForInvoicing', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.value} value={client.value}>
                            {client.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientQuotingContact">Client Quoting Contact *</Label>
                    <Input
                      id="clientQuotingContact"
                      {...register('clientQuotingContact', { required: true })}
                      placeholder="Contact name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientHSR">Client HSR (Health Safety Rep) *</Label>
                    <Input
                      id="clientHSR"
                      {...register('clientHSR', { required: true })}
                      placeholder="HSR name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientSiteContact">Client Site Contact *</Label>
                    <Input
                      id="clientSiteContact"
                      {...register('clientSiteContact', { required: true })}
                      placeholder="Site contact name"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="clientJobPO">Client Job PO (Purchase Order)</Label>
                    <Input
                      id="clientJobPO"
                      {...register('clientJobPO')}
                      placeholder="PO Number"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Worksite Tab */}
              <TabsContent value="worksite" className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="isNewWorksiteAddress"
                    onCheckedChange={(checked) => setValue('isNewWorksiteAddress', checked as boolean)}
                  />
                  <Label htmlFor="isNewWorksiteAddress" className="cursor-pointer">
                    New Worksite Address (Not in Google Maps)
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="worksiteStreet">Worksite Street Address *</Label>
                    <Input
                      id="worksiteStreet"
                      {...register('worksiteStreet', { required: true })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="worksiteCity">City *</Label>
                    <Input
                      id="worksiteCity"
                      {...register('worksiteCity', { required: true })}
                      placeholder="Auckland"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="worksiteState">State/Region</Label>
                    <Input
                      id="worksiteState"
                      {...register('worksiteState')}
                      placeholder="Auckland Region"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="worksitePostalCode">Postal Code</Label>
                    <Input
                      id="worksitePostalCode"
                      {...register('worksitePostalCode')}
                      placeholder="1010"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="worksiteCountry">Country *</Label>
                    <Input
                      id="worksiteCountry"
                      {...register('worksiteCountry', { required: true })}
                      placeholder="New Zealand"
                    />
                  </div>

                  <div className="flex items-center space-x-2 col-span-2">
                    <Checkbox
                      id="showInGoogleMaps"
                      defaultChecked={true}
                      onCheckedChange={(checked) => setValue('showInGoogleMaps', checked as boolean)}
                    />
                    <Label htmlFor="showInGoogleMaps" className="cursor-pointer">
                      Show in Google Maps
                    </Label>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="workComments">Work Comments</Label>
                    <Textarea
                      id="workComments"
                      {...register('workComments')}
                      placeholder="Additional notes about the worksite..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Staff Section */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Staff Assignments</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="staffQuoter">Staff Quoting</Label>
                      <Input
                        id="staffQuoter"
                        {...register('staffQuoter')}
                        placeholder="Staff member ID or name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staffProjectManager">Staff Project Manager</Label>
                      <Input
                        id="staffProjectManager"
                        {...register('staffProjectManager')}
                        placeholder="Project manager ID or name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staffTeamLeader">Staff Team Leader</Label>
                      <Input
                        id="staffTeamLeader"
                        {...register('staffTeamLeader')}
                        placeholder="Team leader ID or name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staffHSR">Staff HSR Site</Label>
                      <Input
                        id="staffHSR"
                        {...register('staffHSR')}
                        placeholder="HSR ID or name"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Quote Tab */}
              <TabsContent value="quote" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quoteFormat">Quote Format *</Label>
                    <Select onValueChange={(value) => setValue('quoteFormat', value as QuoteFormat)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Detailed">Detailed</SelectItem>
                        <SelectItem value="Summary">Summary</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remSQM">Rem SQM</Label>
                    <Input
                      id="remSQM"
                      type="number"
                      step="0.01"
                      {...register('remSQM', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="quoteSpecialTerms">Quote Special Terms</Label>
                    <Textarea
                      id="quoteSpecialTerms"
                      {...register('quoteSpecialTerms')}
                      placeholder="Any special terms for this quote..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="scopeOfWorks">Scope of Works/Requirements</Label>
                    <Textarea
                      id="scopeOfWorks"
                      {...register('scopeOfWorks')}
                      placeholder="Detailed scope of works..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="scopeTextWithoutNumbering">Scope Text (without numbering)</Label>
                    <Textarea
                      id="scopeTextWithoutNumbering"
                      {...register('scopeTextWithoutNumbering')}
                      placeholder="Scope text without numbering..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="scopeTextWithNumbering">Scope Text (with numbering)</Label>
                    <Textarea
                      id="scopeTextWithNumbering"
                      {...register('scopeTextWithNumbering')}
                      placeholder="1. Item one&#10;2. Item two..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="additionalTerms">Additional Terms</Label>
                    <Textarea
                      id="additionalTerms"
                      {...register('additionalTerms')}
                      placeholder="Additional terms and conditions..."
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Dates Tab */}
              <TabsContent value="dates" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      {...register('expiryDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedStartDate">Estimated Start Date</Label>
                    <Input
                      id="estimatedStartDate"
                      type="date"
                      {...register('estimatedStartDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedWeeks">Estimated Weeks</Label>
                    <Input
                      id="estimatedWeeks"
                      type="number"
                      {...register('estimatedWeeks', { valueAsNumber: true })}
                      placeholder="4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedEndDate">Estimated End Date</Label>
                    <Input
                      id="estimatedEndDate"
                      type="date"
                      {...register('estimatedEndDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followupDate">Followup Date</Label>
                    <Input
                      id="followupDate"
                      type="date"
                      {...register('followupDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quoteRequiredBy">Quote Required By</Label>
                    <Input
                      id="quoteRequiredBy"
                      type="date"
                      {...register('quoteRequiredBy')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="worksafeNoticeExpiryDate">Worksafe Notice Expiry Date</Label>
                    <Input
                      id="worksafeNoticeExpiryDate"
                      type="date"
                      {...register('worksafeNoticeExpiryDate')}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="weeklyInspection"
                      onCheckedChange={(checked) => setValue('weeklyInspection', checked as boolean)}
                    />
                    <Label htmlFor="weeklyInspection" className="cursor-pointer">
                      Weekly Inspection
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="monthlyInspection"
                      onCheckedChange={(checked) => setValue('monthlyInspection', checked as boolean)}
                    />
                    <Label htmlFor="monthlyInspection" className="cursor-pointer">
                      Monthly Inspection
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="worksafeNotifiableInspection"
                      onCheckedChange={(checked) => setValue('worksafeNotifiableInspection', checked as boolean)}
                    />
                    <Label htmlFor="worksafeNotifiableInspection" className="cursor-pointer">
                      Worksafe Notifiable Inspection (over 5m)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="electricalInspectionPowerlines"
                      onCheckedChange={(checked) => setValue('electricalInspectionPowerlines', checked as boolean)}
                    />
                    <Label htmlFor="electricalInspectionPowerlines" className="cursor-pointer">
                      Electrical Inspection for Powerlines to House
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="electricalInspectionStreetCables"
                      onCheckedChange={(checked) => setValue('electricalInspectionStreetCables', checked as boolean)}
                    />
                    <Label htmlFor="electricalInspectionStreetCables" className="cursor-pointer">
                      Electrical Inspection for Street Cables
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="produceTrafficPlan"
                      onCheckedChange={(checked) => setValue('produceTrafficPlan', checked as boolean)}
                    />
                    <Label htmlFor="produceTrafficPlan" className="cursor-pointer">
                      Produce Traffic Plan
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="orderConsultingEngineering"
                      onCheckedChange={(checked) => setValue('orderConsultingEngineering', checked as boolean)}
                    />
                    <Label htmlFor="orderConsultingEngineering" className="cursor-pointer">
                      Order Consulting Engineering Services
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="orderPS1Engineering"
                      onCheckedChange={(checked) => setValue('orderPS1Engineering', checked as boolean)}
                    />
                    <Label htmlFor="orderPS1Engineering" className="cursor-pointer">
                      Order PS1 Engineering Services
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="orderPS4Engineering"
                      onCheckedChange={(checked) => setValue('orderPS4Engineering', checked as boolean)}
                    />
                    <Label htmlFor="orderPS4Engineering" className="cursor-pointer">
                      Order PS4 Engineering Services
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reviewedByOperationsManagement"
                      onCheckedChange={(checked) => setValue('reviewedByOperationsManagement', checked as boolean)}
                    />
                    <Label htmlFor="reviewedByOperationsManagement" className="cursor-pointer">
                      Reviewed by Operations Management
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating Job...' : 'Create Job'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewJobPage() {
  return (
    <ProtectedRoute requiredDashboard="site_manager">
      <NewJobForm />
    </ProtectedRoute>
  );
}
