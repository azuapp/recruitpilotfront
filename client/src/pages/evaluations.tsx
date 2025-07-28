import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, TrendingUp, Users, Award, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  position: string;
  resumeSummary?: string;
}

interface Assessment {
  id: string;
  candidateId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  aiInsights: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface JobDescription {
  id: string;
  title: string;
  description: string;
  requirements: string;
  skills: string[];
  experienceLevel: string;
}

interface EvaluationResult {
  candidateId: string;
  candidateName: string;
  position: string;
  fitScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceMatch: number;
  educationMatch: number;
  overallRecommendation: string;
  ranking: number;
}

export default function Evaluations() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Add debugging for auth state
  console.log("Auth state:", { isAuthenticated, isLoading });
  const { t, language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Fetch candidates
  const { data: candidates } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  // Fetch assessments
  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  // Fetch job descriptions
  const { data: jobDescriptions } = useQuery<JobDescription[]>({
    queryKey: ["/api/job-descriptions"],
    retry: false,
  });

  // Fetch evaluations
  const { data: evaluations, refetch: refetchEvaluations } = useQuery<EvaluationResult[]>({
    queryKey: ["/api/evaluations"],
    retry: false,
  });

  // Run evaluation mutation
  const evaluationMutation = useMutation({
    mutationFn: async (position: string) => {
      try {
        console.log("Starting evaluation for position:", position);
        const response = await fetch("/api/evaluations/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ position }),
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in again to continue");
          }
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}`);
          } else {
            throw new Error(`Authentication error - please refresh and log in again`);
          }
        }
        
        const result = await response.json();
        console.log("Evaluation response:", result);
        return result;
      } catch (error) {
        console.error("Mutation function error:", error);
        // Handle empty error objects
        if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
          throw new Error("Unknown error occurred during evaluation");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Evaluation success:", data);
      if (data && (data.count || data.results)) {
        toast({
          title: "Success", 
          description: `Evaluated ${data.count || data.results?.length || 0} candidates successfully`,
        });
        // Force refetch after a short delay
        setTimeout(() => {
          refetchEvaluations();
        }, 500);
      } else {
        toast({
          title: "Info",
          description: "Evaluation completed but no results found",
        });
      }
      setIsEvaluating(false);
    },
    onError: (error: any) => {
      console.error("Evaluation error:", error);
      let errorMessage = "Failed to run evaluation";
      
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.toString && error.toString() !== '[object Object]') {
          errorMessage = error.toString();
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsEvaluating(false);
    },
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const handleRunEvaluation = () => {
    setIsEvaluating(true);
    evaluationMutation.mutate(selectedPosition);
  };

  // Get unique positions
  const positions = Array.from(new Set(candidates?.map(c => c.position) || []));

  // Merge evaluation data with candidate and assessment info
  const mergedEvaluations = evaluations?.map(evaluation => {
    const candidate = candidates?.find(c => c.id === evaluation.candidateId);
    const assessment = assessments?.find(a => a.candidateId === evaluation.candidateId);
    return {
      ...evaluation,
      candidate,
      assessment,
    };
  }) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <div className={`${isRTL ? 'mr-64' : 'ml-64'} p-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("candidateEvaluations")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("aiPoweredEvaluationDescription")}
            </p>
          </div>

          {/* Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("evaluationControls")}
              </CardTitle>
              <CardDescription>
                {t("selectPositionEvaluate")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectPosition")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allPositions")}</SelectItem>
                      {positions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleRunEvaluation}
                  disabled={isEvaluating || evaluationMutation.isPending}
                  className="gap-2"
                >
                  {isEvaluating || evaluationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Award className="h-4 w-4" />
                  )}
                  {isEvaluating ? t("evaluating") : t("runEvaluation")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {evaluations && evaluations.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalEvaluated")}</p>
                      <p className="text-2xl font-bold">{evaluations.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t("topCandidates")}</p>
                      <p className="text-2xl font-bold">
                        {evaluations.filter(e => e.fitScore >= 80).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t("avgFitScore")}</p>
                      <p className="text-2xl font-bold">
                        {Math.round(evaluations.reduce((acc, e) => acc + e.fitScore, 0) / evaluations.length)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Evaluation Results */}
          {mergedEvaluations.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t("evaluationResults")}
              </h2>
              
              {mergedEvaluations.map((evaluation, index) => (
                <Card key={evaluation.candidateId} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                            #{evaluation.ranking}
                          </div>
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {evaluation.candidateName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {evaluation.candidateName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {evaluation.position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("fitScore")}
                          </span>
                          <Badge variant={getScoreBadgeVariant(evaluation.fitScore)}>
                            {evaluation.fitScore}%
                          </Badge>
                        </div>
                        <Progress value={evaluation.fitScore} className="w-24" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {t("experienceMatch")}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={evaluation.experienceMatch} className="flex-1" />
                          <span className={`text-sm font-medium ${getScoreColor(evaluation.experienceMatch)}`}>
                            {evaluation.experienceMatch}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {t("educationMatch")}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={evaluation.educationMatch} className="flex-1" />
                          <span className={`text-sm font-medium ${getScoreColor(evaluation.educationMatch)}`}>
                            {evaluation.educationMatch}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {t("skillsMatch")}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={(evaluation.matchingSkills.length / (evaluation.matchingSkills.length + evaluation.missingSkills.length)) * 100} className="flex-1" />
                          <span className="text-sm font-medium">
                            {evaluation.matchingSkills.length}/{evaluation.matchingSkills.length + evaluation.missingSkills.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {t("matchingSkills")}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {evaluation.matchingSkills.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {evaluation.matchingSkills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{evaluation.matchingSkills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {t("missingSkills")}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {evaluation.missingSkills.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {evaluation.missingSkills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{evaluation.missingSkills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {t("aiRecommendation")}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {evaluation.overallRecommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t("noEvaluationsAvailable")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t("runEvaluationMessage")}
                </p>
                <Button onClick={handleRunEvaluation} disabled={isEvaluating}>
                  {isEvaluating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("evaluating")}
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      {t("startEvaluation")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}