import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Brain,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalCandidates: number;
  activePositions: number;
  interviews: number;
  assessments: number;
}

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [, setLocation] = useLocation();

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

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <main className={cn(
        "flex-1 min-h-screen w-full",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-4 lg:p-6 mt-14 lg:mt-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{t("dashboard")}</h2>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">{t("overviewDescription")}</p>
            </div>
            <div className="flex-shrink-0">
              <Button 
                onClick={() => setLocation("/job-descriptions")}
                className="bg-primary text-white hover:bg-blue-700 w-full sm:w-auto text-sm px-4 py-2"
              >
                <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t("newPosition")}</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between h-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t("totalCandidates")}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                      {statsLoading ? "..." : stats?.totalCandidates || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-accent mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{t("growing")}</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="text-primary text-base sm:text-lg lg:text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between h-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t("activePositions")}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                      {statsLoading ? "..." : stats?.activePositions || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{t("acrossDepartments")}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="text-accent text-base sm:text-lg lg:text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between h-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t("interviewsScheduled")}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                      {statsLoading ? "..." : stats?.interviews || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-amber-600 mt-1 truncate">{t("thisWeek")}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="text-amber-600 text-base sm:text-lg lg:text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between h-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t("aiAssessments")}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                      {statsLoading ? "..." : stats?.assessments || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-purple-600 mt-1 truncate">{t("completed")}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="text-purple-600 text-base sm:text-lg lg:text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t("quickActions")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Button 
                      className="w-full justify-between bg-primary text-white hover:bg-blue-700"
                      onClick={() => window.location.href = '/assessments'}
                    >
                      <div className="flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        {t("runAiAssessment")}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      onClick={() => window.location.href = '/emails'}
                    >
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {t("sendBulkEmails")}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      onClick={() => window.location.href = '/candidates'}
                    >
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {t("viewCandidates")}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      onClick={() => window.location.href = '/interviews'}
                    >
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {t("scheduleInterview")}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("recentActivity")}</h3>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{t("newApplicationsReceived")}</p>
                    <p className="text-xs text-gray-500">{t("checkCandidatesPageDetails")}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{t("aiAssessmentsCompleted")}</p>
                    <p className="text-xs text-gray-500">{t("reviewScoresInsights")}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{t("interviewsScheduledActivity")}</p>
                    <p className="text-xs text-gray-500">{t("manageYourCalendar")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
