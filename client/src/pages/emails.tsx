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
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6 lg:ml-0 ml-0 mt-16 lg:mt-0">
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
          {/* Email List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {emailsLoading ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading emails...
                  </div>
                ) : emails?.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No emails sent yet. Email history will appear here once emails are sent to candidates.
                  </div>
                ) : (
                  // Display mock data or real data
                  (emails?.length ? emails : mockEmails).map((email, index) => (
                    <div key={email.id || index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {(email.candidateName || "Unknown").split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {email.subject}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {email.sentAt}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Sent to: {email.candidateEmail || "candidate@email.com"}
                          </p>
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {email.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-3">
                            {getStatusBadge(email.status)}
                            {getTypeBadge(email.type)}
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
