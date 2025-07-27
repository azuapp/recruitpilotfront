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
import { Send } from "lucide-react";

interface EmailHistory {
  id: string;
  candidateId: string;
  subject: string;
  content: string;
  emailType: string;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export default function Emails() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    candidateId: "",
    subject: "",
    content: "",
    emailType: "follow-up"
  });
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  // Send email mutation 
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: { to: string; subject: string; body: string }) => {
      const res = await apiRequest("POST", "/api/send-email", emailData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      setIsEmailDialogOpen(false);
      setEmailForm({
        candidateId: "",
        subject: "",
        content: "",
        emailType: "follow-up"
      });
      setSelectedCandidate(null);
      setCandidateSearch("");
      setShowCandidateDropdown(false);
      toast({
        title: "Email Sent",
        description: `Email sent successfully!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!selectedCandidate || !emailForm.subject || !emailForm.content) {
      toast({
        title: "Validation Error",
        description: "Please select a candidate and fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const emailData = {
      to: selectedCandidate.email,
      subject: emailForm.subject,
      body: emailForm.content
    };

    sendEmailMutation.mutate(emailData);
  };

  // Toggle email card expansion
  const toggleEmailExpansion = (emailId: string) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
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

  const { data: emails, isLoading: emailsLoading } = useQuery<EmailHistory[]>({
    queryKey: ["/api/emails"],
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
    candidate.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    candidate.position.toLowerCase().includes(candidateSearch.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      sent: { label: t("sent"), className: "bg-green-100 text-green-800" },
      delivered: { label: t("delivered"), className: "bg-green-100 text-green-800" },
      pending: { label: t("pending"), className: "bg-amber-100 text-amber-800" },
      failed: { label: t("failed"), className: "bg-red-100 text-red-800" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      confirmation: { label: "Confirmation", className: "bg-gray-100 text-gray-800" },
      interview: { label: "Interview", className: "bg-blue-100 text-blue-800" },
      "follow-up": { label: "Follow-up", className: "bg-amber-100 text-amber-800" },
      rejection: { label: "Rejection", className: "bg-red-100 text-red-800" },
      offer: { label: "Offer", className: "bg-green-100 text-green-800" },
    };
    
    const config = typeMap[type as keyof typeof typeMap] || typeMap.confirmation;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  // Mock email data since we don't have real data yet
  const mockEmails = [
    {
      id: "1",
      candidateName: "Michael Johnson",
      candidateEmail: "michael.j@email.com",
      subject: "Interview Confirmation - Frontend Developer",
      content: "Interview scheduled for December 15, 2024 at 10:00 AM via video call...",
      type: "interview",
      status: "delivered",
      sentAt: "2 hours ago"
    },
    {
      id: "2",
      candidateName: "Sarah Chen",
      candidateEmail: "sarah.chen@email.com",
      subject: "Application Received - UX Designer",
      content: "Thank you for your application for the UX Designer position. We have received your application and will review it shortly...",
      type: "confirmation",
      status: "delivered",
      sentAt: "4 hours ago"
    },
    {
      id: "3",
      candidateName: "David Rodriguez",
      candidateEmail: "d.rodriguez@email.com",
      subject: "Follow-up Required - Data Scientist",
      content: "We need additional information regarding your availability for the Data Scientist position...",
      type: "follow-up",
      status: "pending",
      sentAt: "1 day ago"
    }
  ];

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6 mt-16 lg:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("emailHistory")}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{t("trackEmailCommunications")}</p>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Send className="w-4 h-4 mr-2" />
                    {t("sendEmail")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{t("sendEmail")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Candidate</Label>
                      <div className="relative">
                        <Input
                          value={selectedCandidate ? `${selectedCandidate.fullName} (${selectedCandidate.email})` : candidateSearch}
                          onChange={(e) => {
                            setCandidateSearch(e.target.value);
                            setSelectedCandidate(null);
                            setShowCandidateDropdown(true);
                          }}
                          onFocus={() => setShowCandidateDropdown(true)}
                          placeholder="Search candidates by name, email, or position..."
                          className="w-full"
                        />
                        {showCandidateDropdown && filteredCandidates.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                            {filteredCandidates.slice(0, 10).map((candidate) => (
                              <div
                                key={candidate.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                onClick={() => {
                                  setSelectedCandidate(candidate);
                                  setCandidateSearch("");
                                  setShowCandidateDropdown(false);
                                }}
                              >
                                <div className="font-medium text-gray-900">{candidate.fullName}</div>
                                <div className="text-sm text-gray-600">{candidate.email}</div>
                                <div className="text-xs text-gray-500">{candidate.position}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>{t("emailSubject")}</Label>
                      <Input
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Email subject..."
                      />
                    </div>
                    <div>
                      <Label>{t("emailType")}</Label>
                      <Select value={emailForm.emailType} onValueChange={(value) => setEmailForm(prev => ({ ...prev, emailType: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmation">Confirmation</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="rejection">Rejection</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("emailContent")}</Label>
                      <Textarea
                        value={emailForm.content}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Email content..."
                        rows={6}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleSendEmail} 
                        disabled={sendEmailMutation.isPending}
                        className="flex-1"
                      >
                        {sendEmailMutation.isPending ? "Sending..." : t("send")}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEmailDialogOpen(false)}
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
          {/* Email History Cards */}
          <div className="space-y-6">
            {emailsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading emails...</div>
              </div>
            ) : emails?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">No emails sent yet. Email history will appear here once emails are sent to candidates.</div>
              </div>
            ) : (
              // Display email cards with full details
              (emails?.length ? emails : mockEmails).map((email, index) => {
                const emailId = email.id || `mock-${index}`;
                const isExpanded = expandedEmails.has(emailId);
                
                return (
                  <Card key={emailId} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Email Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {((email as any).candidateName || "Unknown").split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {email.subject}
                              </h3>
                              <p className="text-sm text-gray-600">
                                To: <span className="font-medium">{(email as any).candidateName || "Unknown Candidate"}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(email.status)}
                            {getTypeBadge((email as any).type || (email as any).emailType)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleEmailExpansion(emailId)}
                              className="ml-2"
                            >
                              {isExpanded ? "Show Less" : "Show More"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Email Details - Only show when expanded */}
                      {isExpanded && (
                        <div className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recipient Email</label>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {(email as any).candidateEmail || "candidate@email.com"}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sent Date</label>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {email.sentAt || "Just now"}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Type</label>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {((email as any).type || (email as any).emailType)?.charAt(0).toUpperCase() + ((email as any).type || (email as any).emailType)?.slice(1) || "General"}
                              </p>
                            </div>
                          </div>

                          {/* Email Content */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Content</label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                              <div 
                                className="text-sm text-gray-700"
                                dangerouslySetInnerHTML={{ 
                                  __html: email.content || "No content available" 
                                }}
                              />
                            </div>
                          </div>

                          {/* Email Footer */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-gray-500">
                                Email ID: {emailId}
                              </span>
                              {(email as any).candidateId && (
                                <span className="text-xs text-gray-500">
                                  Candidate ID: {(email as any).candidateId}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Copy email content to clipboard
                                  navigator.clipboard.writeText(email.content || "");
                                  toast({
                                    title: "Copied",
                                    description: "Email content copied to clipboard",
                                  });
                                }}
                              >
                                Copy Content
                              </Button>
                              {(email as any).candidateEmail && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Open email client with pre-filled data
                                    window.location.href = `mailto:${(email as any).candidateEmail}?subject=Re: ${email.subject}`;
                                  }}
                                >
                                  Reply
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Collapsed view - Brief summary */}
                      {!isExpanded && (
                        <div className="px-6 py-3 bg-gray-50">
                          <p className="text-sm text-gray-600">
                            Sent to: <span className="font-medium">{(email as any).candidateEmail || "candidate@email.com"}</span> • {email.sentAt || "Just now"}
                          </p>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: (email.content?.replace(/<[^>]*>/g, '').substring(0, 150) || "No content available") + 
                                        (email.content && email.content.replace(/<[^>]*>/g, '').length > 150 ? "..." : "")
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
