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
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Globe,
  FileText,
  Calendar,
  Edit3,
  Trash2,
  Loader2
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
  assessment?: {
    id: string;
    overallScore: string;
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
  const [positionFilter, setPositionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithAssessment | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);

  const exportCandidates = () => {
    if (!candidates || candidates.length === 0) {
      toast({
        title: t("export"),
        description: "No candidates to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = candidates.map(candidate => ({
      name: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      status: candidate.status,
      appliedAt: candidate.appliedAt,
      score: candidate.assessment?.overallScore || "N/A"
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: t("export"),
      description: "Candidates exported successfully",
    });
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

  const { data: candidates, isLoading: candidatesLoading } = useQuery<CandidateWithAssessment[]>({
    queryKey: ["/api/candidates"],
    retry: false,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ candidateId, status }: { candidateId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/candidates/${candidateId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Status Updated",
        description: "Candidate status updated successfully",
      });
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
        title: "Update Failed",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (candidateId: string, newStatus: string) => {
    updateStatusMutation.mutate({ candidateId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: t("new"), variant: "default" as const, className: "bg-blue-100 text-blue-800" },
      reviewed: { label: t("reviewed"), variant: "secondary" as const, className: "bg-green-100 text-green-800" },
      interview: { label: t("interview"), variant: "outline" as const, className: "bg-amber-100 text-amber-800" },
      hired: { label: t("hired"), variant: "default" as const, className: "bg-green-100 text-green-800" },
      rejected: { label: t("rejected"), variant: "destructive" as const, className: "bg-red-100 text-red-800" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.new;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Action functions for the three buttons
  const handleViewDetails = (candidate: CandidateWithAssessment) => {
    setSelectedCandidate(candidate);
  };

  const handleDownloadCV = async (candidate: CandidateWithAssessment) => {
    try {
      const response = await fetch(`/api/candidates/${candidate.id}/download-cv`);
      if (!response.ok) {
        throw new Error('Failed to download CV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = candidate.cvFileName || 'CV.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Successful",
        description: `Downloaded ${candidate.fullName}'s CV`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download CV",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedCandidate || !emailSubject || !emailMessage) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedCandidate.email,
          subject: emailSubject,
          message: emailMessage,
          candidateId: selectedCandidate.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: "Email Sent",
        description: `Email sent to ${selectedCandidate.fullName}`,
      });
      
      setEmailSubject("");
      setEmailMessage("");
      setSelectedCandidate(null);
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  // Delete candidate mutation
  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const response = await apiRequest("DELETE", `/api/candidates/${candidateId}`);
      return response.json();
    },
    onMutate: async (candidateId: string) => {
      // Set loading state for this specific candidate
      setDeletingCandidateId(candidateId);
    },
    onSuccess: (data, candidateId) => {
      // Clear loading state
      setDeletingCandidateId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: isRTL ? "تم حذف المرشح" : "Candidate Deleted",
        description: isRTL ? "تم حذف المرشح بنجاح" : "Candidate deleted successfully",
      });
    },
    onError: (error: any, candidateId) => {
      // Clear loading state on error
      setDeletingCandidateId(null);
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
        description: error.message || (isRTL ? "فشل في حذف المرشح" : "Failed to delete candidate"),
        variant: "destructive",
      });
    },
  });

  const handleDeleteCandidate = (candidate: CandidateWithAssessment) => {
    // Prevent multiple delete operations
    if (deletingCandidateId) {
      return;
    }
    
    const confirmMessage = isRTL 
      ? `${t("confirmDeleteCandidate")} (${candidate.fullName})`
      : `${t("confirmDeleteCandidate")} (${candidate.fullName})`;
    
    if (window.confirm(confirmMessage)) {
      deleteCandidateMutation.mutate(candidate.id);
    }
  };

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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{t("candidates")}</h2>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">{t("manageReviewApplications")}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
              <Button variant="outline" onClick={exportCandidates} className="w-full sm:w-auto text-sm px-4 py-2">
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t("export")}</span>
              </Button>
              <Button className="w-full sm:w-auto text-sm px-4 py-2">
                <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t("filter")}</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-6">
          {/* Filters */}
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label>{t("search")}</Label>
                  <Input
                    placeholder={`${t("search")} ${t("candidates").toLowerCase()}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t("position")}</Label>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t("filterByPosition")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="frontend-developer">Frontend Developer</SelectItem>
                      <SelectItem value="backend-developer">Backend Developer</SelectItem>
                      <SelectItem value="ui-ux-designer">UI/UX Designer</SelectItem>
                      <SelectItem value="data-scientist">Data Scientist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("status")}</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t("filterByStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">{t("new")}</SelectItem>
                      <SelectItem value="reviewed">{t("reviewed")}</SelectItem>
                      <SelectItem value="interview">{t("interview")}</SelectItem>
                      <SelectItem value="hired">{t("hired")}</SelectItem>
                      <SelectItem value="rejected">{t("rejected")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("dateRange")}</Label>
                  <Input type="date" className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidates List */}
          {candidatesLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading candidates...</div>
            </div>
          ) : !candidates || candidates.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  No candidates have applied yet. Applications will appear here once submitted.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {candidates.map((candidate) => (
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
                    {candidatesLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Loading candidates...
                        </td>
                      </tr>
                    ) : candidates?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No candidates found. Applications will appear here once submitted.
                        </td>
                      </tr>
                    ) : (
                      candidates?.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(candidate.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {candidate.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-900">
                              {candidate.position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="text-sm text-gray-900">
                              {new Date(candidate.appliedAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(candidate.appliedAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(candidate.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            {candidate.assessment ? (
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate.assessment.overallScore}%
                                </div>
                                <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${candidate.assessment.overallScore}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDetails(candidate)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadCV(candidate)}
                                title="Download CV"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    title="Update Status"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Update Status - {candidate.fullName}</DialogTitle>
                                    <DialogDescription>
                                      Change the candidate's application status
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="status-select">Current Status: {candidate.status}</Label>
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
                                    variant="ghost" 
                                    size="sm"
                                    title="Send Email"
                                    onClick={() => {
                                      setSelectedCandidate(candidate);
                                      setEmailSubject(`Regarding your application for ${candidate.position}`);
                                    }}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Send Email to {candidate.fullName}</DialogTitle>
                                    <DialogDescription>
                                      Compose an email to the candidate
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="email-subject">Subject</Label>
                                      <Input
                                        id="email-subject"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="Email subject"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="email-message">Message</Label>
                                      <Textarea
                                        id="email-message"
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        rows={5}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <DialogTrigger asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogTrigger>
                                      <Button onClick={handleSendEmail}>Send Email</Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteCandidate(candidate)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                disabled={deletingCandidateId === candidate.id}
                                title={t("deleteCandidate")}
                              >
                                {deletingCandidateId === candidate.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing results for candidates
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="w-4 h-4 ml-1" />
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Details Dialog */}
      {selectedCandidate && (
        <Dialog open={!!selectedCandidate && !emailSubject} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedCandidate.fullName}
              </DialogTitle>
              <DialogDescription>
                Candidate details and assessment information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{t("personalInformation")}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedCandidate.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedCandidate.phone}</span>
                    </div>
                    {selectedCandidate.linkedinProfile && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <a 
                          href={selectedCandidate.linkedinProfile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedCandidate.cvFileName}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{t("applicationDetails")}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Applied: {new Date(selectedCandidate.appliedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Position: {selectedCandidate.position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Status: </span>
                      {getStatusBadge(selectedCandidate.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Results */}
              {selectedCandidate.assessment && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{t("assessmentResults")}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <CardHeader className="p-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold">{selectedCandidate.assessment.overallScore}%</div>
                      </CardContent>
                    </Card>
                    <Card className="p-4">
                      <CardHeader className="p-0 pb-2">
                        <CardTitle className="text-sm font-medium">Technical Skills</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold">{selectedCandidate.assessment.technicalSkills}%</div>
                      </CardContent>
                    </Card>
                    <Card className="p-4">
                      <CardHeader className="p-0 pb-2">
                        <CardTitle className="text-sm font-medium">Experience Match</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold">{selectedCandidate.assessment.experienceMatch}%</div>
                      </CardContent>
                    </Card>
                    <Card className="p-4">
                      <CardHeader className="p-0 pb-2">
                        <CardTitle className="text-sm font-medium">Education</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold">{selectedCandidate.assessment.education}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Insights */}
                  <div className="space-y-2">
                    <h4 className="font-medium">{t("aiInsights")}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedCandidate.assessment.aiInsights}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
