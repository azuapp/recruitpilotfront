import { useEffect, useState, useRef } from "react";
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
  const [candidateSearch, setCandidateSearch] = useState("");
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // Edit interview state
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      setSelectedCandidate(null);
      setCandidateSearch("");
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
    if (!selectedCandidate || !interviewForm.scheduledDate) {
      toast({
        title: "Validation Error",
        description: "Please select a candidate and interview date",
        variant: "destructive",
      });
      return;
    }
    scheduleInterviewMutation.mutate(interviewForm);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCandidateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Fetch candidates for the searchable dropdown
  const { data: candidates } = useQuery<any[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  // Filter candidates based on search
  const filteredCandidates = candidates?.filter(candidate =>
    candidate.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    candidate.email.toLowerCase().includes(candidateSearch.toLowerCase())
  ) || [];

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

  // Calendar helper functions
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const getInterviewsForDate = (day: number, month: number, year: number) => {
    if (!interviews) return [];
    
    const targetDate = new Date(year, month, day);
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduledDate);
      return interviewDate.toDateString() === targetDate.toDateString();
    });
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    }
  };

  // Action handlers
  const handleJoinMeeting = (interview: Interview) => {
    // Generate Google Meet link
    const meetUrl = `https://meet.google.com/new`;
    window.open(meetUrl, '_blank');
    
    toast({
      title: "Meeting Started",
      description: "Google Meet opened in new tab",
    });
  };

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview(interview);
    const candidate = candidates?.find(c => c.id === interview.candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setCandidateSearch(candidate.fullName);
    }
    
    // Convert timestamp back to datetime-local format
    const interviewDate = new Date(interview.scheduledDate);
    const localDateTime = new Date(interviewDate.getTime() - interviewDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setInterviewForm({
      candidateId: interview.candidateId,
      scheduledDate: localDateTime,
      interviewType: interview.interviewType,
      notes: interview.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleSendEmail = async (interview: Interview, candidate: any) => {
    if (!candidate) {
      toast({
        title: "Error",
        description: "Candidate information not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const interviewDate = new Date(interview.scheduledDate);
      const formattedDate = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = interviewDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const emailData = {
        to: candidate.email,
        subject: `Interview Invitation - ${candidate.position} Position`,
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin-bottom: 20px; text-align: center;">Interview Invitation</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${candidate.fullName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              We are pleased to invite you for an interview for the <strong>${candidate.position}</strong> position at our company.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-bottom: 15px;">Interview Details:</h3>
              <p style="margin: 8px 0; color: #374151;"><strong>📅 Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>🕒 Time:</strong> ${formattedTime}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>💻 Type:</strong> ${interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1)} Interview</p>
              ${interview.notes ? `<p style="margin: 8px 0; color: #374151;"><strong>📝 Notes:</strong> ${interview.notes}</p>` : ''}
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Please confirm your availability by replying to this email. If you need to reschedule, please let us know as soon as possible.
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              We look forward to speaking with you and learning more about your qualifications.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The Recruitment Team</strong><br>
                RecruitPro
              </p>
            </div>
          </div>
        </div>`
      };

      const res = await apiRequest("POST", "/api/send-email", emailData);
      
      toast({
        title: "Email Sent",
        description: `Interview details sent to ${candidate.email}`,
      });
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update interview mutation
  const updateInterviewMutation = useMutation({
    mutationFn: async (data: typeof interviewForm & { id: string }) => {
      try {
        const res = await apiRequest("PUT", `/api/interviews/${data.id}`, data);
        return await res.json();
      } catch (error) {
        console.error('Error in interview update mutation:', error);
        throw error;
      }
    },
    onSuccess: async (updatedInterview) => {
      console.log('Interview update successful:', updatedInterview);
      // Force refetch of interviews data
      await queryClient.refetchQueries({ queryKey: ["/api/interviews"] });
      setIsEditDialogOpen(false);
      setEditingInterview(null);
      setInterviewForm({
        candidateId: "",
        scheduledDate: "",
        interviewType: "video",
        notes: ""
      });
      setSelectedCandidate(null);
      setCandidateSearch("");
      setShowCandidateDropdown(false);
      toast({
        title: "Interview Updated",
        description: "Interview updated successfully",
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

  const handleUpdateInterview = () => {
    if (!editingInterview || !interviewForm.candidateId || !interviewForm.scheduledDate) {
      console.log('Validation failed:', {
        editingInterview: !!editingInterview,
        candidateId: interviewForm.candidateId,
        scheduledDate: interviewForm.scheduledDate
      });
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    console.log('Updating interview with data:', {
      ...interviewForm,
      id: editingInterview.id
    });

    updateInterviewMutation.mutate({
      ...interviewForm,
      id: editingInterview.id
    });
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  // Filter interviews for today
  const today = new Date();
  const todayString = today.toDateString();
  
  const todaysInterviews = interviews?.filter(interview => {
    const interviewDate = new Date(interview.scheduledDate);
    return interviewDate.toDateString() === todayString;
  }).map(interview => {
    const candidate = candidates?.find(c => c.id === interview.candidateId);
    const interviewDate = new Date(interview.scheduledDate);
    
    const borderColorMap = {
      'video': 'border-blue-500',
      'phone': 'border-green-500',
      'in-person': 'border-amber-500'
    };
    
    return {
      candidateName: candidate?.fullName || 'Unknown Candidate',
      position: candidate?.position || 'N/A',
      time: interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1).replace('-', ' '),
      borderColor: borderColorMap[interview.interviewType as keyof typeof borderColorMap] || 'border-blue-500'
    };
  }) || [];

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6 lg:ml-0 ml-0 mt-16 lg:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("interviews")}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{t("scheduleManageInterviews")}</p>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    {t("scheduleInterview")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" aria-describedby="schedule-interview-desc">
                  <DialogHeader>
                    <DialogTitle>{t("scheduleInterview")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative" ref={dropdownRef}>
                      <Label>Candidate</Label>
                      <Input
                        value={candidateSearch}
                        onChange={(e) => {
                          setCandidateSearch(e.target.value);
                          setShowCandidateDropdown(true);
                        }}
                        onFocus={() => setShowCandidateDropdown(true)}
                        placeholder="Search candidates by name or email..."
                        className="mt-2"
                      />
                      {selectedCandidate && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {selectedCandidate.fullName.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{selectedCandidate.fullName}</span>
                            <span className="text-xs text-gray-500">({selectedCandidate.email})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(null);
                              setCandidateSearch("");
                              setInterviewForm(prev => ({ ...prev, candidateId: "" }));
                            }}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                      {showCandidateDropdown && candidateSearch && filteredCandidates.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredCandidates.slice(0, 10).map((candidate) => (
                            <div
                              key={candidate.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setCandidateSearch(candidate.fullName);
                                setShowCandidateDropdown(false);
                                setInterviewForm(prev => ({ ...prev, candidateId: candidate.id }));
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback>
                                    {candidate.fullName.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{candidate.fullName}</div>
                                  <div className="text-xs text-gray-500">{candidate.email}</div>
                                  <div className="text-xs text-blue-600">{candidate.position.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {showCandidateDropdown && candidateSearch && filteredCandidates.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                          <div className="text-sm text-gray-500 text-center">No candidates found</div>
                        </div>
                      )}
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

              {/* Edit Interview Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Interview</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative" ref={dropdownRef}>
                      <Label>Candidate</Label>
                      <Input
                        value={candidateSearch}
                        onChange={(e) => {
                          setCandidateSearch(e.target.value);
                          setShowCandidateDropdown(true);
                        }}
                        onFocus={() => setShowCandidateDropdown(true)}
                        placeholder="Search candidates by name or email..."
                        className="mt-2"
                      />
                      {selectedCandidate && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {selectedCandidate.fullName.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{selectedCandidate.fullName}</span>
                            <span className="text-xs text-gray-500">({selectedCandidate.email})</span>
                          </div>
                        </div>
                      )}
                      {showCandidateDropdown && candidateSearch && filteredCandidates.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredCandidates.slice(0, 10).map((candidate) => (
                            <div
                              key={candidate.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setCandidateSearch(candidate.fullName);
                                setShowCandidateDropdown(false);
                                setInterviewForm(prev => ({ ...prev, candidateId: candidate.id }));
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback>
                                    {candidate.fullName.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{candidate.fullName}</div>
                                  <div className="text-xs text-gray-500">{candidate.email}</div>
                                  <div className="text-xs text-blue-600">{candidate.position.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Interview Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={interviewForm.scheduledDate}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Interview Type</Label>
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
                      <Label>Notes</Label>
                      <Textarea
                        value={interviewForm.notes}
                        onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleUpdateInterview} 
                        disabled={updateInterviewMutation.isPending}
                        className="flex-1"
                      >
                        {updateInterviewMutation.isPending ? "Updating..." : "Update Interview"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      {monthNames[calendarMonth]} {calendarYear}
                    </h3>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
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
                    
                    {/* Calendar Days - Dynamic dates */}
                    {(() => {
                      const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
                      const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
                      const today = new Date();
                      const isCurrentMonth = today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;
                      const todayDate = today.getDate();
                      
                      const calendarDays = [];
                      
                      // Previous month's trailing days
                      for (let i = 0; i < firstDay; i++) {
                        calendarDays.push(
                          <div key={`prev-${i}`} className="p-2 text-center text-sm text-gray-300">
                            
                          </div>
                        );
                      }
                      
                      // Current month's days
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dayInterviews = getInterviewsForDate(day, calendarMonth, calendarYear);
                        const isToday = isCurrentMonth && day === todayDate;
                        const hasInterviews = dayInterviews.length > 0;
                        
                        calendarDays.push(
                          <div
                            key={day}
                            className={`p-2 text-center text-sm relative cursor-pointer hover:bg-gray-50 rounded ${
                              isToday ? 'bg-blue-100 text-primary font-medium' : 'text-gray-900'
                            } ${hasInterviews ? 'font-medium' : ''}`}
                            title={hasInterviews ? `${dayInterviews.length} interview(s) scheduled` : ''}
                          >
                            {day}
                            {hasInterviews && (
                              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                                {dayInterviews.slice(0, 3).map((_, index) => (
                                  <div key={index} className="w-1 h-1 bg-primary rounded-full"></div>
                                ))}
                                {dayInterviews.length > 3 && (
                                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return calendarDays;
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Interviews */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Interviews</h3>
                <div className="space-y-4">
                  {todaysInterviews.length > 0 ? (
                    todaysInterviews.map((interview, index) => (
                      <div key={index} className={`border-l-4 ${interview.borderColor} pl-4 py-2`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{interview.candidateName}</h4>
                          <span className="text-sm text-gray-500">{interview.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{interview.position}</p>
                        <p className="text-xs text-gray-500 mt-1">{interview.type}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No interviews scheduled for today</p>
                      <p className="text-xs mt-1">Schedule new interviews to see them here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview List */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t("allInterviews")}</h3>
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
                          No interviews scheduled.
                        </td>
                      </tr>
                    ) : (
                      // Display real interview data
                      interviews?.map((interview) => {
                        const candidate = candidates?.find(c => c.id === interview.candidateId);
                        return (
                        <tr key={interview.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {candidate?.fullName ? candidate.fullName.split(' ').map((n: string) => n[0]).join('') : 'NA'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate?.fullName || 'Unknown Candidate'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {candidate?.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate?.position || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(interview.scheduledDate).toLocaleDateString()}</div>
                            <div className="text-sm text-gray-500">{new Date(interview.scheduledDate).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {interview.interviewType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(interview.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleJoinMeeting(interview)}
                                title="Start Google Meet"
                              >
                                {getTypeIcon(interview.interviewType)}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditInterview(interview)}
                                title="Edit Interview"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSendEmail(interview, candidate)}
                                title="Send Email"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })
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
