import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Briefcase,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobDescription {
  id: string;
  title?: string;
  position: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  requiredExperience?: string;
  benefits?: string;
  skills: string;
  experienceLevel?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JobDescriptionForm {
  title: string;
  position: string;
  description: string;
  responsibilities: string;
  requirements: string;
  requiredExperience: string;
  benefits: string;
  skills: string;
  experienceLevel: string;
  location: string;
  salaryMin: number | '';
  salaryMax: number | '';
  notes: string;
}

export default function JobDescriptions() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJobDescription, setEditingJobDescription] = useState<JobDescription | null>(null);
  const [formData, setFormData] = useState<JobDescriptionForm>({
    title: "",
    position: "",
    description: "",
    responsibilities: "",
    requirements: "",
    requiredExperience: "",
    benefits: "",
    skills: "",
    experienceLevel: "",
    location: "",
    salaryMin: '',
    salaryMax: '',
    notes: "",
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: jobDescriptions, isLoading: jobDescriptionsLoading } = useQuery<JobDescription[]>({
    queryKey: ["/api/job-descriptions"],
    retry: false,
  });

  const createJobDescriptionMutation = useMutation({
    mutationFn: async (data: JobDescriptionForm) => {
      const res = await apiRequest("POST", "/api/job-descriptions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Job description created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create job description",
        variant: "destructive",
      });
    },
  });

  const updateJobDescriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobDescriptionForm> }) => {
      const res = await apiRequest("PUT", `/api/job-descriptions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      setIsDialogOpen(false);
      setEditingJobDescription(null);
      resetForm();
      toast({
        title: "Success",
        description: "Job description updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update job description",
        variant: "destructive",
      });
    },
  });

  const deleteJobDescriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/job-descriptions/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      toast({
        title: "Success",
        description: "Job description deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete job description",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      position: "",
      description: "",
      responsibilities: "",
      requirements: "",
      requiredExperience: "",
      benefits: "",
      skills: "",
      experienceLevel: "",
      location: "",
      salaryMin: '',
      salaryMax: '',
      notes: "",
    });
  };

  const handleEdit = (jobDescription: JobDescription) => {
    setEditingJobDescription(jobDescription);
    setFormData({
      title: jobDescription.title || "",
      position: jobDescription.position || "",
      description: jobDescription.description || "",
      responsibilities: jobDescription.responsibilities || "",
      requirements: jobDescription.requirements || "",
      requiredExperience: jobDescription.requiredExperience || "",
      benefits: jobDescription.benefits || "",
      skills: jobDescription.skills || "",
      experienceLevel: jobDescription.experienceLevel || "",
      location: jobDescription.location || "",
      salaryMin: jobDescription.salaryMin || '',
      salaryMax: jobDescription.salaryMax || '',
      notes: jobDescription.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.position || !formData.skills) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Position and Skills)",
        variant: "destructive",
      });
      return;
    }

    // Convert salary fields to numbers if they're not empty
    const submitData = {
      ...formData,
      salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
      salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
    };

    if (editingJobDescription) {
      updateJobDescriptionMutation.mutate({
        id: editingJobDescription.id,
        data: submitData,
      });
    } else {
      createJobDescriptionMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this job description?")) {
      deleteJobDescriptionMutation.mutate(id);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <main className={cn(
        "flex-1 min-h-screen",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6 mt-16 lg:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('jobDescriptions')}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('manageJobRequirements')}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingJobDescription(null); resetForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addJobDescription')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingJobDescription ? t('editJobDescription') : t('addNewJobDescription')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="position">{t('positionTitle')} *</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder={t('positionPlaceholder')}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="responsibilities">{t('keyResponsibilities')} *</Label>
                    <Textarea
                      id="responsibilities"
                      value={formData.responsibilities}
                      onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                      placeholder={t('responsibilitiesPlaceholder')}
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="requiredExperience">{t('requiredExperience')} *</Label>
                    <Textarea
                      id="requiredExperience"
                      value={formData.requiredExperience}
                      onChange={(e) => setFormData({ ...formData, requiredExperience: e.target.value })}
                      placeholder={t('experiencePlaceholder')}
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="skills">{t('requiredSkills')} *</Label>
                    <Textarea
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder={t('skillsPlaceholder')}
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">{t('additionalNotes')}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('notesPlaceholder')}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingJobDescription(null);
                        resetForm();
                      }}
                    >
                      {t('cancel')}
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createJobDescriptionMutation.isPending || updateJobDescriptionMutation.isPending}
                    >
                      {editingJobDescription ? t('edit') : t('save')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Job Descriptions List */}
          {jobDescriptionsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading job descriptions...</div>
            </div>
          ) : !jobDescriptions || jobDescriptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noJobDescriptions')}</h3>
                <p className="text-gray-500 mb-4">
                  {t('createJobDescriptionsMessage')}
                </p>
                <Button onClick={() => { setEditingJobDescription(null); resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addFirstJobDescription')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {jobDescriptions.map((jobDescription) => (
                <Card key={jobDescription.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="w-5 h-5" />
                          {jobDescription.position}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {t('created')} {new Date(jobDescription.createdAt).toLocaleDateString()}
                          </div>
                          <Badge variant={jobDescription.isActive ? "default" : "secondary"}>
                            {jobDescription.isActive ? t('active') : t('inactive')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(jobDescription)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(jobDescription.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{t('keyResponsibilities')}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {jobDescription.responsibilities}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{t('requiredExperience')}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {jobDescription.requiredExperience}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{t('requiredSkills')}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {jobDescription.skills}
                        </p>
                      </div>
                      {jobDescription.notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{t('additionalNotes')}</h4>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {jobDescription.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}