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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  Settings,
  Lightbulb,
  Star,
  Trash2,
  Loader2,
  User,
  Calendar,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Assessment {
  id: string;
  candidateId: string;
  overallScore: number;
  technicalSkills: string;
  experienceMatch: string;
  education: string;
  aiInsights: string;
  status: string;
  processedAt?: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  position: string;
}

export default function Assessments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(new Set());
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");

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

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  const { data: candidates } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await apiRequest("DELETE", `/api/assessments/${assessmentId}`);
      return response.json();
    },
    onMutate: async (assessmentId: string) => {
      setDeletingAssessmentId(assessmentId);
    },
    onSuccess: () => {
      setDeletingAssessmentId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: t("assessmentDeleted"),
        description: t("assessmentDeletedSuccessfully"),
      });
    },
    onError: (error: any) => {
      setDeletingAssessmentId(null);
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
        description: error.message || "Failed to delete assessment",
        variant: "destructive",
      });
    },
  });

  const bulkAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/assessments/bulk");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: t("bulkAssessmentCompleted"),
        description: data.message || `Processed ${data.processed || 0} candidates`,
      });
    },
    onError: (error: any) => {
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
        title: t("assessmentFailed"),
        description: error.message || t("failedToRunBulkAssessment"),
        variant: "destructive",
      });
    },
  });

  const positionAssessmentMutation = useMutation({
    mutationFn: async (position: string) => {
      const response = await apiRequest("POST", `/api/assessments/position/${position}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: t("positionAssessmentCompleted"),
        description: data.message || `Processed ${data.processed || 0} candidates`,
      });
    },
    onError: (error: any) => {
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
        title: t("assessmentFailed"),
        description: error.message || t("failedToRunPositionAssessment"),
        variant: "destructive",
      });
    },
  });

  const candidateAssessmentMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const response = await apiRequest("POST", `/api/assessments/candidate/${candidateId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: t("candidateAssessmentCompleted"),
        description: data.message || "Assessment completed successfully",
      });
      setSelectedCandidateId("");
    },
    onError: (error: any) => {
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
        title: t("assessmentFailed"),
        description: error.message || t("failedToRunCandidateAssessment"),
        variant: "destructive",
      });
    },
  });

  const handleBulkAssessment = () => {
    if (!candidates?.length) {
      toast({
        title: "No Candidates",
        description: t("noCandidatesAvailable"),
        variant: "destructive",
      });
      return;
    }
    bulkAssessmentMutation.mutate();
  };

  const handlePositionAssessment = () => {
    if (selectedPosition === "all") {
      toast({
        title: t("selectPosition"),
        description: t("pleaseSelectPosition"),
        variant: "destructive",
      });
      return;
    }
    positionAssessmentMutation.mutate(selectedPosition);
  };

  const handleCandidateAssessment = () => {
    if (!selectedCandidateId) {
      toast({
        title: t("selectCandidate"),
        description: t("pleaseSelectCandidate"),
        variant: "destructive",
      });
      return;
    }
    candidateAssessmentMutation.mutate(selectedCandidateId);
  };

  const handleDeleteAssessment = (assessment: Assessment) => {
    if (!confirm(t("deleteAssessmentConfirm"))) return;
    deleteAssessmentMutation.mutate(assessment.id);
  };

  const toggleAssessmentExpansion = (assessmentId: string) => {
    const newExpanded = new Set(expandedAssessments);
    if (newExpanded.has(assessmentId)) {
      newExpanded.delete(assessmentId);
    } else {
      newExpanded.add(assessmentId);
    }
    setExpandedAssessments(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { label: "Completed", variant: "default" as const },
      pending: { label: "Pending", variant: "secondary" as const },
      failed: { label: "Failed", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const };
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique positions from candidates
  const uniquePositions = candidates 
    ? Array.from(new Set(candidates.map(c => c.position))).filter(Boolean)
    : [];

  // Get candidates without assessments for individual assessment
  const candidatesWithoutAssessment = candidates?.filter(candidate => 
    !assessments?.some(assessment => assessment.candidateId === candidate.id)
  ) || [];

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
                {t("assessments")}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                {t("aiPoweredCandidateAssessments")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Bulk Assessment */}
              <Button
                onClick={handleBulkAssessment}
                disabled={bulkAssessmentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bulkAssessmentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    {t("runBulkAssessment")}
                  </>
                )}
              </Button>

              {/* Position Assessment */}
              <div className="flex gap-2">
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("selectPosition")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allPositions")}</SelectItem>
                    {uniquePositions.map(position => (
                      <SelectItem key={position} value={position}>
                        {position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handlePositionAssessment}
                  disabled={positionAssessmentMutation.isPending || selectedPosition === "all"}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {positionAssessmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      {t("assessByPosition")}
                    </>
                  )}
                </Button>
              </div>

              {/* Individual Candidate Assessment */}
              <div className="flex gap-2">
                <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("selectCandidate")} />
                  </SelectTrigger>
                  <SelectContent>
                    {candidatesWithoutAssessment.map(candidate => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleCandidateAssessment}
                  disabled={candidateAssessmentMutation.isPending || !selectedCandidateId}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {candidateAssessmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      {t("assessCandidate")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {assessments && assessments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">{t("totalAssessments")}</p>
                      <p className="text-lg sm:text-xl font-bold">{assessments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">{t("averageScore")}</p>
                      <p className="text-lg sm:text-xl font-bold">
                        {(() => {
                          const validScores = assessments.filter(a => {
                            const score = typeof a.overallScore === 'number' ? a.overallScore : parseFloat(String(a.overallScore));
                            return a.overallScore != null && !isNaN(score);
                          });
                          if (validScores.length === 0) return "N/A";
                          const average = validScores.reduce((acc, a) => {
                            const score = typeof a.overallScore === 'number' ? a.overallScore : parseFloat(String(a.overallScore));
                            return acc + score;
                          }, 0) / validScores.length;
                          return Math.round(average) + "%";
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">{t("highScores")}</p>
                      <p className="text-lg sm:text-xl font-bold">
                        {assessments.filter(a => {
                          const score = parseFloat(String(a.overallScore));
                          return a.overallScore != null && !isNaN(score) && score >= 80;
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">{t("completed")}</p>
                      <p className="text-lg sm:text-xl font-bold">
                        {assessments.filter(a => a.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assessments List */}
          {assessmentsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
              <div className="text-gray-500 mt-2">{t("loadingAssessments")}</div>
            </div>
          ) : !assessments || assessments.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{t("noAssessmentsFound")}</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  {t("assessmentsWillAppear")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {assessments
                .sort((a, b) => {
                  // Sort by overall score in descending order (highest first)
                  const scoreA = Number(a.overallScore) || 0;
                  const scoreB = Number(b.overallScore) || 0;
                  return scoreB - scoreA;
                })
                .map((assessment) => {
                const candidate = candidates?.find(c => c.id === assessment.candidateId);
                const isExpanded = expandedAssessments.has(assessment.id);
                
                return (
                  <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarFallback className="text-sm sm:text-base">
                                {candidate ? getInitials(candidate.fullName) : 'NA'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                {candidate?.fullName || t("unknownCandidate")}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {candidate?.position ? candidate.position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {getStatusBadge(assessment.status)}
                          </div>
                        </div>

                        {/* Score Row */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{t("overallScore")}</span>
                            <span className={cn("text-lg font-bold", getScoreColor(Number(assessment.overallScore) || 0))}>
                              {(() => {
                                const score = Number(assessment.overallScore);
                                return assessment.overallScore != null && !isNaN(score) ? `${Math.round(score)}%` : 'N/A';
                              })()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={cn("h-2 rounded-full transition-all", getScoreBackground(Number(assessment.overallScore) || 0))}
                              style={{ width: `${(() => {
                                const score = Number(assessment.overallScore);
                                return assessment.overallScore != null && !isNaN(score) ? score : 0;
                              })()}%` }}
                            />
                          </div>
                        </div>

                        {/* Assessment Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <Target className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">{t("skills")}: {assessment.technicalSkills}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">{t("experience")}: {assessment.experienceMatch}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">{t("education")}: {assessment.education}</span>
                          </div>
                        </div>

                        {/* AI Insights */}
                        {assessment.aiInsights && (
                          <div className="border-t border-gray-100 pt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-gray-700">{t("aiInsights")}</span>
                            </div>
                            <div className={cn(
                              "text-xs sm:text-sm text-gray-600 bg-blue-50 p-2 rounded",
                              !isExpanded && "line-clamp-2"
                            )}>
                              {assessment.aiInsights}
                            </div>
                            {assessment.aiInsights.length > 150 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAssessmentExpansion(assessment.id)}
                                className="mt-2 h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Processed Date */}
                        {assessment.processedAt && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Processed: {new Date(assessment.processedAt).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAssessment(assessment)}
                            className="flex items-center space-x-1 text-xs px-3 py-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingAssessmentId === assessment.id}
                          >
                            {deletingAssessmentId === assessment.id ? (
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
        </div>
      </main>
    </div>
  );
}