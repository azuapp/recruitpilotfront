import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Settings,
  Lightbulb,
  Star,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Assessment {
  id: string;
  candidateId: string;
  overallScore: string;
  technicalSkills: string;
  experienceMatch: string;
  education: string;
  aiInsights: string;
  status: string;
  processedAt?: string;
}

export default function Assessments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  
  // Delete assessment state
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);

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

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  // Delete assessment mutation
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await apiRequest("DELETE", `/api/assessments/${assessmentId}`);
      return response.json();
    },
    onMutate: async (assessmentId: string) => {
      setDeletingAssessmentId(assessmentId);
    },
    onSuccess: (data, assessmentId) => {
      setDeletingAssessmentId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: isRTL ? "تم حذف التقييم" : "Assessment Deleted",
        description: isRTL ? "تم حذف التقييم بنجاح" : "Assessment deleted successfully",
      });
    },
    onError: (error: any, assessmentId) => {
      setDeletingAssessmentId(null);
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
        title: isRTL ? "خطأ في الحذف" : "Delete Error",
        description: error.message || (isRTL ? "فشل في حذف التقييم" : "Failed to delete assessment"),
        variant: "destructive",
      });
    },
  });

  const handleDeleteAssessment = (assessmentId: string, candidateName: string) => {
    if (deletingAssessmentId) {
      return;
    }
    
    const confirmMessage = isRTL 
      ? `${t("confirmDeleteAssessment")} (${candidateName})`
      : `${t("confirmDeleteAssessment")} (${candidateName})`;
    
    if (window.confirm(confirmMessage)) {
      deleteAssessmentMutation.mutate(assessmentId);
    }
  };

  // Bulk assessment mutation
  const bulkAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/assessments/bulk');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Assessment Completed",
        description: data.message,
      });
      // Refresh assessments data
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
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
        title: "Assessment Failed",
        description: error.message || "Failed to run bulk assessment",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  // Get candidates to merge with assessments
  const { data: candidates } = useQuery<any[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  // Merge assessments with candidate data
  const mergedAssessments = assessments?.map(assessment => {
    const candidate = candidates?.find((c: any) => c.id === assessment.candidateId);
    return {
      ...assessment,
      candidateName: candidate?.fullName || 'Unknown Candidate',
      position: candidate?.position || 'Unknown Position',
      overallScore: parseFloat(assessment.overallScore) || 0,
      technicalSkills: parseFloat(assessment.technicalSkills) || 0,
      experienceMatch: parseFloat(assessment.experienceMatch) || 0,
      education: parseFloat(assessment.education) || 0,
      insights: assessment.aiInsights ? assessment.aiInsights.split('\n').filter(insight => insight.trim()) : [],
      processedAt: assessment.processedAt ? new Date(assessment.processedAt).toLocaleDateString() : 'Recently',
      isTopCandidate: parseFloat(assessment.overallScore) > 80
    };
  }) || [];

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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("aiAssessmentsPage")}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{t("aiPoweredResumeAnalysis")}</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => bulkAssessmentMutation.mutate()}
                disabled={bulkAssessmentMutation.isPending}
              >
                <Brain className="w-4 h-4 mr-2" />
                {bulkAssessmentMutation.isPending ? "Running..." : "Run Bulk Assessment"}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Assessment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("totalAssessments")}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {assessmentsLoading ? "..." : mergedAssessments.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Brain className="text-purple-600 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("averageScore")}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">82%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-accent text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("processing")}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Settings className="text-amber-600 text-xl animate-spin" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Results */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t("assessmentResults")}</h3>
              <div className="divide-y divide-gray-200">
                {assessmentsLoading ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading assessments...
                  </div>
                ) : mergedAssessments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No assessments completed yet. Click "Run Bulk Assessment" to process candidates.
                  </div>
                ) : (
                  mergedAssessments.map((assessment) => (
                    <div key={assessment.id} className="py-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {assessment.candidateName.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-gray-900">
                              {assessment.candidateName}
                            </h4>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className="text-2xl font-bold text-green-600">
                                  {assessment.overallScore}%
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-green-500 h-3 rounded-full" 
                                    style={{ width: `${assessment.overallScore}%` }}
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAssessment(assessment.id, assessment.candidateName)}
                                disabled={deletingAssessmentId === assessment.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={t("deleteAssessment")}
                              >
                                {deletingAssessmentId === assessment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            {assessment.position} • Assessed {assessment.processedAt}
                          </p>
                          
                          {/* Skills Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Technical Skills</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress value={assessment.technicalSkills} className="flex-1" />
                                <span className="text-sm text-gray-600 min-w-[3rem]">
                                  {assessment.technicalSkills}%
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Experience Match</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress value={assessment.experienceMatch} className="flex-1" />
                                <span className="text-sm text-gray-600 min-w-[3rem]">
                                  {assessment.experienceMatch}%
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Education</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress value={assessment.education} className="flex-1" />
                                <span className="text-sm text-gray-600 min-w-[3rem]">
                                  {assessment.education}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* AI Insights */}
                          <div className={`rounded-lg p-4 ${
                            assessment.isTopCandidate ? 'bg-green-50' : 'bg-blue-50'
                          }`}>
                            <h5 className={`text-sm font-medium mb-2 ${
                              assessment.isTopCandidate ? 'text-green-900' : 'text-blue-900'
                            }`}>
                              {assessment.isTopCandidate ? (
                                <>
                                  <Star className="w-4 h-4 inline mr-2" />
                                  Top Candidate
                                </>
                              ) : (
                                <>
                                  <Lightbulb className="w-4 h-4 inline mr-2" />
                                  AI Insights
                                </>
                              )}
                            </h5>
                            <ul className={`text-sm space-y-1 ${
                              assessment.isTopCandidate ? 'text-green-800' : 'text-blue-800'
                            }`}>
                              {assessment.insights.map((insight, i) => (
                                <li key={i}>• {insight}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
