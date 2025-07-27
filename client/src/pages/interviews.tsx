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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  CalendarPlus, 
  Video, 
  Edit, 
  Mail,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Interview {
  id: string;
  candidateId: string;
  scheduledDate: string;
  interviewType: string;
  status: string;
  notes?: string;
}

export default function Interviews() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    candidateId: "",
    scheduledDate: "",
    interviewType: "video",
    notes: ""
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: async (data: typeof interviewForm) => {
      const res = await apiRequest("POST", "/api/interviews", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      setIsScheduleDialogOpen(false);
      setInterviewForm({
        candidateId: "",
        scheduledDate: "",
        interviewType: "video",
        notes: ""
      });
      toast({
        title: t("scheduleInterview"),
        description: "Interview scheduled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScheduleInterview = () => {
    if (!interviewForm.candidateId || !interviewForm.scheduledDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    scheduleInterviewMutation.mutate(interviewForm);
  };

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

  const { data: interviews, isLoading: interviewsLoading } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: t("scheduled"), className: "bg-blue-100 text-blue-800" },
      completed: { label: t("completed"), className: "bg-green-100 text-green-800" },
      cancelled: { label: t("cancelled"), className: "bg-red-100 text-red-800" },
      rescheduled: { label: t("rescheduled"), className: "bg-amber-100 text-amber-800" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  // Mock data for today's interviews
  const todaysInterviews = [
    {
      candidateName: "Michael Johnson",
      position: "Frontend Developer",
      time: "10:00 AM",
      type: "Video Call",
      borderColor: "border-blue-500"
    },
    {
      candidateName: "Sarah Chen",
      position: "UX Designer",
      time: "2:30 PM",
      type: "In-person",
      borderColor: "border-amber-500"
    },
    {
      candidateName: "David Rodriguez",
      position: "Data Scientist",
      time: "4:00 PM",
      type: "Phone Call",
      borderColor: "border-green-500"
    }
  ];

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6 lg:ml-0 ml-0 mt-16 lg:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("interviews")}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Schedule and manage candidate interviews</p>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    {t("scheduleInterview")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("scheduleInterview")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Candidate ID</Label>
                      <Input
                        value={interviewForm.candidateId}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, candidateId: e.target.value }))}
                        placeholder="Enter candidate ID"
                      />
                    </div>
                    <div>
                      <Label>{t("interviewDate")}</Label>
                      <Input
                        type="datetime-local"
                        value={interviewForm.scheduledDate}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>{t("interviewType")}</Label>
                      <Select value={interviewForm.interviewType} onValueChange={(value) => setInterviewForm(prev => ({ ...prev, interviewType: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="in-person">In-person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("notes")}</Label>
                      <Textarea
                        value={interviewForm.notes}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleScheduleInterview} 
                        disabled={scheduleInterviewMutation.isPending}
                        className="flex-1"
                      >
                        {scheduleInterviewMutation.isPending ? "Scheduling..." : t("schedule")}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsScheduleDialogOpen(false)}
                        className="flex-1"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Calendar and Today's Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">December 2024</h3>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    <div className="p-2 text-center text-sm font-medium text-gray-500">Sun</div>
                    <div className="p-2 text-center text-sm font-medium text-gray-500">Mon</div>
                    <div className="p-2 text-center text-sm font-medium text-gray-500">Tue</div>
                    <div className="p-2 text-center text-sm font-medium text-gray-500">Wed</div>
                    <div className="p-2 text-center text-sm font-medium text-gray-500">Thu</div>
                    <div className="p-2 text-center text-sm font-medium text-gray-500">Fri</div>
                    <div className="p-2 text-center text-sm font-medium text-gray-500">Sat</div>
                    
                    {/* Calendar Days - Sample dates */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 6; // Start from previous month
                      const isCurrentMonth = day > 0 && day <= 31;
                      const isToday = day === 15;
                      const hasInterview = [15, 16, 18].includes(day);
                      
                      return (
                        <div
                          key={i}
                          className={`p-2 text-center text-sm ${
                            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          } ${
                            isToday ? 'bg-blue-100 text-primary font-medium rounded' : ''
                          } ${
                            hasInterview && isCurrentMonth ? 'relative' : ''
                          }`}
                        >
                          {day > 0 ? day : ''}
                          {hasInterview && isCurrentMonth && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Interviews */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Interviews</h3>
                <div className="space-y-4">
                  {todaysInterviews.map((interview, index) => (
                    <div key={index} className={`border-l-4 ${interview.borderColor} pl-4 py-2`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{interview.candidateName}</h4>
                        <span className="text-sm text-gray-500">{interview.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{interview.position}</p>
                      <p className="text-xs text-gray-500 mt-1">{interview.type}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview List */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">All Interviews</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interviewsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Loading interviews...
                        </td>
                      </tr>
                    ) : interviews?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No interviews scheduled. Schedule interviews from the candidates page.
                        </td>
                      </tr>
                    ) : (
                      // Mock interview data since we don't have real data yet
                      todaysInterviews.map((interview, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {interview.candidateName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {interview.candidateName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  candidate@email.com
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {interview.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Dec 15, 2024</div>
                            <div className="text-sm text-gray-500">{interview.time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {interview.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge("scheduled")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                {getTypeIcon("video")}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
