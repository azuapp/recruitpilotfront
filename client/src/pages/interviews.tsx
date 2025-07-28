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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  CalendarPlus, 
  Video, 
  Edit, 
  Mail,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Interview {
  id: string;
  candidateId: string;
  scheduledDate: string;
  interviewType: string;
  status: string;
  notes?: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  position: string;
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
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Edit interview state
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Delete interview state
  const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null);

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

  const { data: interviews, isLoading: interviewsLoading } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
    retry: false,
  });

  const { data: candidates } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  // Filter candidates based on search
  const filteredCandidates = candidates?.filter(candidate =>
    candidate.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    candidate.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    candidate.position.toLowerCase().includes(candidateSearch.toLowerCase())
  ) || [];

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
        title: "Interview Scheduled",
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

  const deleteInterviewMutation = useMutation({
    mutationFn: async (interviewId: string) => {
      const response = await apiRequest("DELETE", `/api/interviews/${interviewId}`);
      return response.json();
    },
    onMutate: async (interviewId: string) => {
      setDeletingInterviewId(interviewId);
    },
    onSuccess: () => {
      setDeletingInterviewId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      toast({
        title: "Interview Deleted",
        description: "Interview deleted successfully",
      });
    },
    onError: (error: any) => {
      setDeletingInterviewId(null);
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
        description: error.message || "Failed to delete interview",
        variant: "destructive",
      });
    },
  });

  const updateInterviewMutation = useMutation({
    mutationFn: async (data: typeof interviewForm & { id: string }) => {
      const res = await apiRequest("PUT", `/api/interviews/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
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

  const handleScheduleSubmit = () => {
    if (!selectedCandidate || !interviewForm.scheduledDate) {
      toast({
        title: "Error",
        description: "Please select a candidate and date",
        variant: "destructive",
      });
      return;
    }

    const finalForm = {
      ...interviewForm,
      candidateId: selectedCandidate.id
    };

    scheduleInterviewMutation.mutate(finalForm);
  };

  const handleEditSubmit = () => {
    if (!editingInterview || !selectedCandidate || !interviewForm.scheduledDate) {
      toast({
        title: "Error",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    const finalForm = {
      ...interviewForm,
      candidateId: selectedCandidate.id,
      id: editingInterview.id
    };

    updateInterviewMutation.mutate(finalForm);
  };

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview(interview);
    const candidate = candidates?.find(c => c.id === interview.candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setCandidateSearch(candidate.fullName);
    }
    
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

  const handleDeleteInterview = (interview: Interview) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;
    deleteInterviewMutation.mutate(interview.id);
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCandidateSearch(candidate.fullName);
    setShowCandidateDropdown(false);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "Scheduled", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
      rescheduled: { label: "Rescheduled", variant: "secondary" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const };
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
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
                {t("interviews")}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Schedule and manage candidate interviews
              </p>
            </div>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs sm:text-sm">
                  <CalendarPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Schedule Interview
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm sm:text-base">Schedule New Interview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Candidate Search */}
                  <div className="relative" ref={dropdownRef}>
                    <Label className="text-sm">Candidate</Label>
                    <Input
                      placeholder="Search candidates..."
                      value={candidateSearch}
                      onChange={(e) => {
                        setCandidateSearch(e.target.value);
                        setShowCandidateDropdown(true);
                      }}
                      onFocus={() => setShowCandidateDropdown(true)}
                      className="mt-2"
                    />
                    {showCandidateDropdown && filteredCandidates.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCandidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => handleCandidateSelect(candidate)}
                          >
                            <div className="font-medium">{candidate.fullName}</div>
                            <div className="text-gray-500">{candidate.email} - {candidate.position}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm">Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={interviewForm.scheduledDate}
                      onChange={(e) => setInterviewForm({ ...interviewForm, scheduledDate: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Interview Type</Label>
                    <Select value={interviewForm.interviewType} onValueChange={(value) => setInterviewForm({ ...interviewForm, interviewType: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video Call</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Notes (Optional)</Label>
                    <Textarea
                      placeholder="Interview notes or special instructions..."
                      value={interviewForm.notes}
                      onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setIsScheduleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleScheduleSubmit} disabled={scheduleInterviewMutation.isPending}>
                      {scheduleInterviewMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <CalendarPlus className="w-3 h-3 mr-1" />
                      )}
                      Schedule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Interviews List */}
          {interviewsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
              <div className="text-gray-500 mt-2">Loading interviews...</div>
            </div>
          ) : !interviews || interviews.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  Schedule your first interview to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {interviews.map((interview) => {
                const candidate = candidates?.find(c => c.id === interview.candidateId);
                const { date, time } = formatDate(interview.scheduledDate);
                
                return (
                  <Card key={interview.id} className="hover:shadow-md transition-shadow">
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
                          <div className="flex-shrink-0">
                            {getStatusBadge(interview.status)}
                          </div>
                        </div>

                        {/* Interview Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">{date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">{time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Video className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600 capitalize">{interview.interviewType}</span>
                          </div>
                          {candidate && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600 truncate">{candidate.email}</span>
                            </div>
                          )}
                        </div>

                        {interview.notes && (
                          <div className="p-2 bg-gray-50 rounded text-xs sm:text-sm text-gray-600">
                            <strong>Notes:</strong> {interview.notes}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditInterview(interview)}
                            className="flex items-center space-x-1 text-xs px-3 py-2 h-8"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteInterview(interview)}
                            className="flex items-center space-x-1 text-xs px-3 py-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingInterviewId === interview.id}
                          >
                            {deletingInterviewId === interview.id ? (
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

          {/* Edit Interview Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">Edit Interview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative" ref={dropdownRef}>
                  <Label className="text-sm">Candidate</Label>
                  <Input
                    placeholder="Search candidates..."
                    value={candidateSearch}
                    onChange={(e) => {
                      setCandidateSearch(e.target.value);
                      setShowCandidateDropdown(true);
                    }}
                    onFocus={() => setShowCandidateDropdown(true)}
                    className="mt-2"
                  />
                  {showCandidateDropdown && filteredCandidates.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredCandidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => handleCandidateSelect(candidate)}
                        >
                          <div className="font-medium">{candidate.fullName}</div>
                          <div className="text-gray-500">{candidate.email} - {candidate.position}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm">Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={interviewForm.scheduledDate}
                    onChange={(e) => setInterviewForm({ ...interviewForm, scheduledDate: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm">Interview Type</Label>
                  <Select value={interviewForm.interviewType} onValueChange={(value) => setInterviewForm({ ...interviewForm, interviewType: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Interview notes or special instructions..."
                    value={interviewForm.notes}
                    onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEditSubmit} disabled={updateInterviewMutation.isPending}>
                    {updateInterviewMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Edit className="w-3 h-3 mr-1" />
                    )}
                    Update
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