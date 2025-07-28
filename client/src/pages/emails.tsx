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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Trash2, Loader2, Mail, User, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  position: string;
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
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null);

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

  const { data: emails, isLoading: emailsLoading } = useQuery<EmailHistory[]>({
    queryKey: ["/api/emails"],
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
      toast({
        title: "Email Sent",
        description: "Email sent successfully!",
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
        title: "Email Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await apiRequest("DELETE", `/api/emails/${emailId}`);
      return response.json();
    },
    onMutate: async (emailId: string) => {
      setDeletingEmailId(emailId);
    },
    onSuccess: () => {
      setDeletingEmailId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Email Deleted",
        description: "Email deleted successfully",
      });
    },
    onError: (error: any) => {
      setDeletingEmailId(null);
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
        description: error.message || "Failed to delete email",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!selectedCandidate || !emailForm.subject || !emailForm.content) {
      toast({
        title: "Error",
        description: "Please complete all required fields",
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

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCandidateSearch(candidate.fullName);
    setShowCandidateDropdown(false);
  };

  const handleDeleteEmail = (email: EmailHistory) => {
    if (!confirm('Are you sure you want to delete this email?')) return;
    deleteEmailMutation.mutate(email.id);
  };

  const toggleEmailExpansion = (emailId: string) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      sent: { label: "Sent", variant: "default" as const },
      pending: { label: "Pending", variant: "secondary" as const },
      failed: { label: "Failed", variant: "destructive" as const },
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
                {t("emails")}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Send and manage candidate communications
              </p>
            </div>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs sm:text-sm">
                  <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Send Email
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm sm:text-base">Send Email to Candidate</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Candidate Search */}
                  <div className="relative">
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
                    <Label className="text-sm">Email Type</Label>
                    <Select value={emailForm.emailType} onValueChange={(value) => setEmailForm({ ...emailForm, emailType: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="interview">Interview Invitation</SelectItem>
                        <SelectItem value="rejection">Rejection</SelectItem>
                        <SelectItem value="offer">Job Offer</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Subject</Label>
                    <Input
                      placeholder="Email subject..."
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Message</Label>
                    <Textarea
                      placeholder="Type your message here..."
                      value={emailForm.content}
                      onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                      rows={6}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEmailDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
                      {sendEmailMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Send className="w-3 h-3 mr-1" />
                      )}
                      Send Email
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Emails List */}
          {emailsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
              <div className="text-gray-500 mt-2">Loading emails...</div>
            </div>
          ) : !emails || emails.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No emails sent</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  Send your first email to a candidate to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {emails.map((email) => {
                const candidate = candidates?.find(c => c.id === email.candidateId);
                const isExpanded = expandedEmails.has(email.id);
                
                return (
                  <Card key={email.id} className="hover:shadow-md transition-shadow">
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
                                {candidate?.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(email.status)}
                          </div>
                        </div>

                        {/* Email Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate flex-1">
                              {email.subject}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0 ml-2">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(email.sentAt || email.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <MessageSquare className="w-3 h-3" />
                            <span className="capitalize">{email.emailType}</span>
                          </div>
                        </div>

                        {/* Email Content */}
                        <div className="border-t border-gray-100 pt-2">
                          <div className={cn(
                            "text-xs sm:text-sm text-gray-600",
                            !isExpanded && "line-clamp-2"
                          )}>
                            {email.content}
                          </div>
                          {email.content.length > 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEmailExpansion(email.id)}
                              className="mt-2 h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </Button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteEmail(email)}
                            className="flex items-center space-x-1 text-xs px-3 py-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingEmailId === email.id}
                          >
                            {deletingEmailId === email.id ? (
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
        </div>
      </main>
    </div>
  );
}