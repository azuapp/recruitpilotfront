import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  Filter, 
  Eye, 
  Mail,
  User,
  Phone,
  Globe,
  FileText,
  Calendar,
  Edit3,
  Trash2,
  Loader2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateWithAssessment {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  linkedinProfile?: string;
  position: string;
  cvFileName: string;
  cvFilePath: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  resumeSummary?: string;
  assessment?: {
    id: string;
    overallScore: number;
    technicalSkills: string;
    experienceMatch: string;
    education: string;
    aiInsights: string;
    status: string;
    processedAt: string;
  };
}

export default function Candidates() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithAssessment | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);

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

  const { data: candidates, isLoading: candidatesLoading } = useQuery<CandidateWithAssessment[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  const deleteCandidate = useMutation({
    mutationFn: async (candidateId: string) => {
      const response = await apiRequest("DELETE", `/api/candidates/${candidateId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Success",
        description: "Candidate deleted successfully",
      });
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to delete candidate",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ candidateId, status }: { candidateId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/candidates/${candidateId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ candidateId, subject, message }: { candidateId: string; subject: string; message: string }) => {
      const response = await apiRequest("POST", "/api/emails/send", {
        candidateId,
        subject,
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      setEmailSubject("");
      setEmailMessage("");
      setSelectedCandidate(null);
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: "New", variant: "default" as const },
      reviewed: { label: "Reviewed", variant: "secondary" as const },
      interview: { label: "Interview", variant: "outline" as const },
      hired: { label: "Hired", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const };
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const handleViewDetails = (candidate: CandidateWithAssessment) => {
    setSelectedCandidate(candidate);
  };

  const handleDownloadCV = async (candidate: CandidateWithAssessment) => {
    try {
      const response = await fetch(`/api/candidates/${candidate.id}/cv`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download CV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = candidate.cvFileName || `${candidate.fullName}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "CV downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download CV",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = (candidateId: string, status: string) => {
    updateStatusMutation.mutate({ candidateId, status });
  };

  const handleDeleteCandidate = async (candidate: CandidateWithAssessment) => {
    if (!confirm(`Are you sure you want to delete ${candidate.fullName}?`)) return;
    
    setDeletingCandidateId(candidate.id);
    try {
      await deleteCandidate.mutateAsync(candidate.id);
    } finally {
      setDeletingCandidateId(null);
    }
  };

  const handleSendEmail = () => {
    if (!selectedCandidate || !emailSubject || !emailMessage) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      candidateId: selectedCandidate.id,
      subject: emailSubject,
      message: emailMessage,
    });
  };

  // Filter candidates based on search and filters
  const filteredCandidates = candidates?.filter(candidate => {
    const matchesSearch = candidate.fullName.toLowerCase().includes(search.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(search.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(search.toLowerCase());
    
    const matchesPosition = positionFilter === "all" || candidate.position === positionFilter;
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    
    return matchesSearch && matchesPosition && matchesStatus;
  });

  const uniquePositions = Array.from(new Set(candidates?.map(c => c.position) || []));

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
                {t("candidates")}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Manage and review job applications
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Export
              </Button>
            </div>
          </div>

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
                  <Label className="text-sm">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidates List */}
          {candidatesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
              <div className="text-gray-500 mt-2">Loading candidates...</div>
            </div>
          ) : !filteredCandidates || filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  {search || positionFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your search filters to see more candidates."
                    : "No candidates have applied yet. Applications will appear here once submitted."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col space-y-3">
                      {/* Header Row: Avatar, Name, Email, Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            <AvatarFallback className="text-sm sm:text-base">
                              {getInitials(candidate.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {candidate.fullName}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {candidate.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(candidate.status)}
                        </div>
                      </div>

                      {/* Info Row: Position, Date, Score */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Position:</span>
                            <span className="text-xs sm:text-sm text-gray-900">
                              {candidate.position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Applied:</span>
                            <span className="text-xs sm:text-sm text-gray-900">
                              {new Date(candidate.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {candidate.assessment && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Score:</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-900">
                              {candidate.assessment.overallScore}%
                            </span>
                            <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${candidate.assessment.overallScore}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions Row */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(candidate)}
                          className="flex items-center space-x-1 text-xs px-3 py-2 h-8"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadCV(candidate)}
                          className="flex items-center space-x-1 text-xs px-3 py-2 h-8"
                        >
                          <Download className="w-3 h-3" />
                          <span>CV</span>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center space-x-1 text-xs px-3 py-2 h-8"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Status</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-md mx-auto">
                            <DialogHeader>
                              <DialogTitle className="text-sm sm:text-base">Update Status - {candidate.fullName}</DialogTitle>
                              <DialogDescription className="text-xs sm:text-sm">
                                Change the candidate's application status
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="status-select" className="text-sm">Current Status: {candidate.status}</Label>
                                <Select onValueChange={(value) => handleStatusUpdate(candidate.id, value)}>
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select new status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="interview">Interview</SelectItem>
                                    <SelectItem value="hired">Hired</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center space-x-1 text-xs px-3 py-2 h-8"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setEmailSubject(`Regarding your application for ${candidate.position}`);
                              }}
                            >
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-md mx-auto">
                            <DialogHeader>
                              <DialogTitle className="text-sm sm:text-base">Send Email to {candidate.fullName}</DialogTitle>
                              <DialogDescription className="text-xs sm:text-sm">
                                Compose an email to the candidate
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="email-subject" className="text-sm">Subject</Label>
                                <Input
                                  id="email-subject"
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                  placeholder="Email subject"
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label htmlFor="email-message" className="text-sm">Message</Label>
                                <Textarea
                                  id="email-message"
                                  value={emailMessage}
                                  onChange={(e) => setEmailMessage(e.target.value)}
                                  placeholder="Type your message here..."
                                  rows={4}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">Cancel</Button>
                                </DialogTrigger>
                                <Button onClick={handleSendEmail} size="sm">Send Email</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCandidate(candidate)}
                          className="flex items-center space-x-1 text-xs px-3 py-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingCandidateId === candidate.id}
                        >
                          {deletingCandidateId === candidate.id ? (
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
              ))}
            </div>
          )}

          {/* Candidate Details Dialog */}
          {selectedCandidate && (
            <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
              <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">{selectedCandidate.fullName}</DialogTitle>
                  <DialogDescription>
                    Application for {selectedCandidate.position}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{selectedCandidate.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-gray-600">{selectedCandidate.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">LinkedIn</Label>
                      <p className="text-sm text-gray-600">
                        {selectedCandidate.linkedinProfile ? (
                          <a href={selectedCandidate.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Profile
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Applied Date</Label>
                      <p className="text-sm text-gray-600">{new Date(selectedCandidate.appliedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {selectedCandidate.resumeSummary && (
                    <div>
                      <Label className="text-sm font-medium">Resume Summary</Label>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{selectedCandidate.resumeSummary}</p>
                    </div>
                  )}
                  
                  {selectedCandidate.assessment && (
                    <div>
                      <Label className="text-sm font-medium">AI Assessment</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Score:</span>
                          <span className="font-medium">{selectedCandidate.assessment.overallScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${selectedCandidate.assessment.overallScore}%` }}
                          />
                        </div>
                        {selectedCandidate.assessment.aiInsights && (
                          <p className="text-xs text-gray-600 mt-2">{selectedCandidate.assessment.aiInsights}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  );
}