import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  Star
} from "lucide-react";

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

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  // Mock assessment data since we don't have real data yet
  const mockAssessments = [
    {
      id: "1",
      candidateName: "Michael Johnson",
      position: "Frontend Developer",
      overallScore: 85,
      technicalSkills: 90,
      experienceMatch: 85,
      education: 75,
      insights: [
        "Strong proficiency in React, JavaScript, and modern frontend frameworks",
        "5+ years of relevant experience with enterprise-level applications",
        "Excellent problem-solving skills demonstrated through portfolio projects",
        "Recommended for technical interview"
      ],
      processedAt: "2 hours ago",
      isTopCandidate: false
    },
    {
      id: "2",
      candidateName: "Sarah Chen",
      position: "UX/UI Designer",
      overallScore: 92,
      technicalSkills: 95,
      experienceMatch: 90,
      education: 88,
      insights: [
        "Exceptional design portfolio with diverse project experience",
        "Strong user research and usability testing background",
        "Proficient in Figma, Adobe Creative Suite, and prototyping tools",
        "Highly recommended for immediate interview"
      ],
      processedAt: "4 hours ago",
      isTopCandidate: true
    }
  ];

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("aiAssessmentsPage")}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{t("aiPoweredResumeAnalysis")}</p>
            </div>
            <div className="flex space-x-3">
              <Button>
                <Brain className="w-4 h-4 mr-2" />
                Run Bulk Assessment
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
                      {assessmentsLoading ? "..." : assessments?.length || mockAssessments.length}
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
                ) : assessments?.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No assessments completed yet. Assessments will appear here once candidates' resumes are processed.
                  </div>
                ) : (
                  // Display mock data or real data
                  mockAssessments.map((assessment, index) => (
                    <div key={assessment.id} className="py-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {assessment.candidateName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-gray-900">
                              {assessment.candidateName}
                            </h4>
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
