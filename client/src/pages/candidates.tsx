import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  Calendar
} from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithAssessment | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

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

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("candidates")}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{t("manageReviewApplications")}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button variant="outline" onClick={exportCandidates} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                {t("export")}
              </Button>
              <Button className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                {t("filter")}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Candidates Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("candidateName")}
                      </th>
                      <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        {t("position")}
                      </th>
                      <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        {t("appliedAt")}
                      </th>
                      <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("status")}
                      </th>
                      <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        {t("score")}
                      </th>
                      <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {candidate.position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                          <td className="px-6 py-4 whitespace-nowrap">
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
