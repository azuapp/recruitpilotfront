import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Briefcase, Calendar, MapPin, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobDescription {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  description: string;
  requirements: string;
  benefits?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function JobDescriptions() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobDescription | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  
  const [jobForm, setJobForm] = useState({
    title: "",
    department: "",
    location: "",
    employmentType: "full-time",
    salaryRange: "",
    description: "",
    requirements: "",
    benefits: "",
    status: "active"
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: jobs, isLoading: jobsLoading } = useQuery<JobDescription[]>({
    queryKey: ["/api/job-descriptions"],
    retry: false,
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: typeof jobForm) => {
      const res = await apiRequest("POST", "/api/job-descriptions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Job Created",
        description: "Job description created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create job description",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async (data: typeof jobForm & { id: string }) => {
      const res = await apiRequest("PUT", `/api/job-descriptions/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      setIsEditDialogOpen(false);
      setEditingJob(null);
      resetForm();
      toast({
        title: "Job Updated",
        description: "Job description updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update job description",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest("DELETE", `/api/job-descriptions/${jobId}`);
      return response.json();
    },
    onMutate: async (jobId: string) => {
      setDeletingJobId(jobId);
    },
    onSuccess: () => {
      setDeletingJobId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      toast({
        title: "Job Deleted",
        description: "Job description deleted successfully",
      });
    },
    onError: (error: any) => {
      setDeletingJobId(null);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete job description",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setJobForm({
      title: "",
      department: "",
      location: "",
      employmentType: "full-time",
      salaryRange: "",
      description: "",
      requirements: "",
      benefits: "",
      status: "active"
    });
  };

  const handleCreateJob = () => {
    if (!jobForm.title || !jobForm.department || !jobForm.description || !jobForm.requirements) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate(jobForm);
  };

  const handleEditJob = (job: JobDescription) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      salaryRange: job.salaryRange || "",
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits || "",
      status: job.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateJob = () => {
    if (!editingJob || !jobForm.title || !jobForm.department || !jobForm.description || !jobForm.requirements) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateJobMutation.mutate({ ...jobForm, id: editingJob.id });
  };

  const handleDeleteJob = (job: JobDescription) => {
    if (!confirm(`Are you sure you want to delete the job "${job.title}"?`)) return;
    deleteJobMutation.mutate(job.id);
  };

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Active", variant: "default" as const },
      inactive: { label: "Inactive", variant: "secondary" as const },
      draft: { label: "Draft", variant: "outline" as const },
      closed: { label: "Closed", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const };
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen bg-gray-50", isRTL ? "flex-row-reverse" : "flex-row")}>
      <Sidebar />
      
      <main className={cn(
        "flex-1 min-w-0 transition-all duration-200",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                Job Descriptions
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Create and manage job postings
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Create Job
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm sm:text-base">Create New Job Description</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Job Title *</Label>
                      <Input
                        placeholder="e.g. Senior Software Engineer"
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Department *</Label>
                      <Input
                        placeholder="e.g. Engineering"
                        value={jobForm.department}
                        onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Location</Label>
                      <Input
                        placeholder="e.g. Remote, New York, London"
                        value={jobForm.location}
                        onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Employment Type</Label>
                      <Select value={jobForm.employmentType} onValueChange={(value) => setJobForm({ ...jobForm, employmentType: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Salary Range</Label>
                      <Input
                        placeholder="e.g. $80,000 - $120,000"
                        value={jobForm.salaryRange}
                        onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Status</Label>
                      <Select value={jobForm.status} onValueChange={(value) => setJobForm({ ...jobForm, status: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Job Description *</Label>
                    <Textarea
                      placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Requirements *</Label>
                    <Textarea
                      placeholder="List the required skills, experience, and qualifications..."
                      value={jobForm.requirements}
                      onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Benefits</Label>
                    <Textarea
                      placeholder="List company benefits, perks, and additional information..."
                      value={jobForm.benefits}
                      onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })}
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreateJob} disabled={createJobMutation.isPending}>
                      {createJobMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      Create Job
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Jobs List */}
          {jobsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
              <div className="text-gray-500 mt-2">Loading job descriptions...</div>
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No job descriptions</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  Create your first job description to start attracting candidates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {jobs.map((job) => {
                const isExpanded = expandedJobs.has(job.id);
                
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {job.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {job.department}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(job.status)}
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
                          {job.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600 truncate">{job.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600 capitalize">{job.employmentType.replace('-', ' ')}</span>
                          </div>
                          {job.salaryRange && (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600 truncate">{job.salaryRange}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">{new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Job Description */}
                        <div className="border-t border-gray-100 pt-3">
                          <div className={cn(
                            "text-xs sm:text-sm text-gray-600",
                            !isExpanded && "line-clamp-2"
                          )}>
                            {job.description}
                          </div>
                          {job.description.length > 150 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleJobExpansion(job.id)}
                              className="mt-2 h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </Button>
                          )}
                        </div>

                        {/* Requirements (when expanded) */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements</h4>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {job.requirements}
                            </div>
                          </div>
                        )}

                        {/* Benefits (when expanded) */}
                        {isExpanded && job.benefits && (
                          <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Benefits</h4>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {job.benefits}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditJob(job)}
                            className="flex items-center space-x-1 text-xs px-3 py-2 h-8"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteJob(job)}
                            className="flex items-center space-x-1 text-xs px-3 py-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingJobId === job.id}
                          >
                            {deletingJobId === job.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Edit Job Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">Edit Job Description</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Job Title *</Label>
                    <Input
                      placeholder="e.g. Senior Software Engineer"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Department *</Label>
                    <Input
                      placeholder="e.g. Engineering"
                      value={jobForm.department}
                      onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Location</Label>
                    <Input
                      placeholder="e.g. Remote, New York, London"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Employment Type</Label>
                    <Select value={jobForm.employmentType} onValueChange={(value) => setJobForm({ ...jobForm, employmentType: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Salary Range</Label>
                    <Input
                      placeholder="e.g. $80,000 - $120,000"
                      value={jobForm.salaryRange}
                      onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Status</Label>
                    <Select value={jobForm.status} onValueChange={(value) => setJobForm({ ...jobForm, status: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Job Description *</Label>
                  <Textarea
                    placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm">Requirements *</Label>
                  <Textarea
                    placeholder="List the required skills, experience, and qualifications..."
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm">Benefits</Label>
                  <Textarea
                    placeholder="List company benefits, perks, and additional information..."
                    value={jobForm.benefits}
                    onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateJob} disabled={updateJobMutation.isPending}>
                    {updateJobMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Edit className="w-3 h-3 mr-1" />
                    )}
                    Update Job
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}