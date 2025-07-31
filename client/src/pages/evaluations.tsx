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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  TrendingUp, 
  Star,
  Award,
  Target,
  Filter,
  Loader2,
  Calendar,
  User,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Evaluation {
  id: string;
  candidateId: string;
  overallScore: number;
  technicalSkills: number;
  experienceMatch: number;
  education: number;
  communicationSkills: number;
  culturalFit: number;
  recommendations: string;
  evaluatedAt: string;
  evaluator?: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  position: string;
}

export default function Evaluations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [expandedEvaluations, setExpandedEvaluations] = useState<Set<string>>(new Set());
  const [selectedPosition, setSelectedPosition] = useState("all");

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

  const { data: evaluations, isLoading: evaluationsLoading } = useQuery<Evaluation[]>({
    queryKey: ["/api/evaluations"],
    retry: false,
  });

  const { data: candidates } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  // Run evaluation mutation
  const runEvaluationMutation = useMutation({
    mutationFn: async (position: string) => {
      const res = await apiRequest("POST", "/api/evaluations/run", { 
        position: position === "all" ? undefined : position 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Evaluation Complete",
        description: `Successfully evaluated ${data.count || 0} candidates`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
    },
    onError: (error) => {
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
        title: "Evaluation Failed",
        description: error.message || "Failed to run candidate evaluation",
        variant: "destructive",
      });
    },
  });

  const handleRunEvaluation = () => {
    if (!candidates || candidates.length === 0) {
      toast({
        title: "No Candidates",
        description: "No candidates available for evaluation",
        variant: "destructive",
      });
      return;
    }
    runEvaluationMutation.mutate(selectedPosition);
  };

  // Filter evaluations based on search and filters
  const filteredEvaluations = evaluations?.filter(evaluation => {
    const candidate = candidates?.find(c => c.id === evaluation.candidateId);
    if (!candidate) return false;

    const matchesSearch = candidate.fullName.toLowerCase().includes(search.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(search.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(search.toLowerCase());
    
    const matchesPosition = positionFilter === "all" || candidate.position === positionFilter;
    
    let matchesScore = true;
    if (scoreFilter === "excellent" && evaluation.overallScore < 90) matchesScore = false;
    if (scoreFilter === "good" && (evaluation.overallScore < 70 || evaluation.overallScore >= 90)) matchesScore = false;
    if (scoreFilter === "average" && (evaluation.overallScore < 50 || evaluation.overallScore >= 70)) matchesScore = false;
    if (scoreFilter === "poor" && evaluation.overallScore >= 50) matchesScore = false;
    
    return matchesSearch && matchesPosition && matchesScore;
  }) || [];

  const uniquePositions = Array.from(new Set(candidates?.map(c => c.position) || []));

  const toggleEvaluationExpansion = (evaluationId: string) => {
    const newExpanded = new Set(expandedEvaluations);
    if (newExpanded.has(evaluationId)) {
      newExpanded.delete(evaluationId);
    } else {
      newExpanded.add(evaluationId);
    }
    setExpandedEvaluations(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 70) return { label: "Good", variant: "secondary" as const };
    if (score >= 50) return { label: "Average", variant: "outline" as const };
    return { label: "Poor", variant: "destructive" as const };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate statistics
  const stats = {
    total: filteredEvaluations.length,
    avgScore: filteredEvaluations.length > 0 
      ? Math.round(filteredEvaluations.reduce((acc, e) => acc + e.overallScore, 0) / filteredEvaluations.length)
      : 0,
    excellent: filteredEvaluations.filter(e => e.overallScore >= 90).length,
    recommended: filteredEvaluations.filter(e => e.recommendations.toLowerCase().includes('recommend')).length
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
                {t("evaluations")}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Comprehensive candidate evaluation results and insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {uniquePositions.map(position => (
                    <SelectItem key={position} value={position}>
                      {position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleRunEvaluation}
                disabled={runEvaluationMutation.isPending || !candidates || candidates.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {runEvaluationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Run Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {evaluations && evaluations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Total Evaluations</p>
                      <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
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
                      <p className="text-xs sm:text-sm text-gray-500">Avg Score</p>
                      <p className="text-lg sm:text-xl font-bold">{stats.avgScore}%</p>
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
                      <p className="text-xs sm:text-sm text-gray-500">Excellent</p>
                      <p className="text-lg sm:text-xl font-bold">{stats.excellent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Recommended</p>
                      <p className="text-lg sm:text-xl font-bold">{stats.recommended}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Search</Label>
                  <Input
                    placeholder="Search by name, email, or position..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Position</Label>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Filter by position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {uniquePositions.map(position => (
                        <SelectItem key={position} value={position}>
                          {position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Score Range</Label>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Filter by score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="excellent">Excellent (90-100%)</SelectItem>
                      <SelectItem value="good">Good (70-89%)</SelectItem>
                      <SelectItem value="average">Average (50-69%)</SelectItem>
                      <SelectItem value="poor">Poor (0-49%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluations List */}
          {evaluationsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
              <div className="text-gray-500 mt-2">Loading evaluations...</div>
            </div>
          ) : !filteredEvaluations || filteredEvaluations.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No evaluations found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  {search || positionFilter !== "all" || scoreFilter !== "all"
                    ? "Try adjusting your search filters to see more evaluations."
                    : "Click 'Run Evaluation' to analyze and score candidates based on their skills and experience."}
                </p>
                {(!evaluations || evaluations.length === 0) && candidates && candidates.length > 0 && (
                  <Button 
                    onClick={handleRunEvaluation}
                    disabled={runEvaluationMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {runEvaluationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Run Your First Evaluation
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredEvaluations.map((evaluation) => {
                const candidate = candidates?.find(c => c.id === evaluation.candidateId);
                const isExpanded = expandedEvaluations.has(evaluation.id);
                const scoreBadge = getScoreBadge(evaluation.overallScore);
                
                return (
                  <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
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
                                {candidate?.fullName || 'Unknown Candidate'}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {candidate?.position || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Badge variant={scoreBadge.variant} className="text-xs">
                              {scoreBadge.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Overall Score */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Overall Score</span>
                            <span className={cn("text-lg font-bold", getScoreColor(evaluation.overallScore))}>
                              {evaluation.overallScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={cn("h-2 rounded-full transition-all", getScoreBackground(evaluation.overallScore))}
                              style={{ width: `${evaluation.overallScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Skills Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Technical</span>
                            <span className="font-medium">{evaluation.technicalSkills}%</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Experience</span>
                            <span className="font-medium">{evaluation.experienceMatch}%</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Education</span>
                            <span className="font-medium">{evaluation.education}%</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Communication</span>
                            <span className="font-medium">{evaluation.communicationSkills}%</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Cultural Fit</span>
                            <span className="font-medium">{evaluation.culturalFit}%</span>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {evaluation.recommendations && (
                          <div className="border-t border-gray-100 pt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Award className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-gray-700">Recommendations</span>
                            </div>
                            <div className={cn(
                              "text-xs sm:text-sm text-gray-600 bg-purple-50 p-2 rounded",
                              !isExpanded && "line-clamp-2"
                            )}>
                              {evaluation.recommendations}
                            </div>
                            {evaluation.recommendations.length > 150 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEvaluationExpansion(evaluation.id)}
                                className="mt-2 h-6 text-xs text-purple-600 hover:text-purple-700 p-0"
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Evaluation Date and Evaluator */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>Evaluated: {new Date(evaluation.evaluatedAt).toLocaleDateString()}</span>
                          </div>
                          {evaluation.evaluator && (
                            <div className="flex items-center space-x-2">
                              <User className="w-3 h-3" />
                              <span>By: {evaluation.evaluator}</span>
                            </div>
                          )}
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