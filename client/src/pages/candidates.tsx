import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Download, 
  Filter, 
  Eye, 
  Mail,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface CandidateWithAssessment {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  linkedinProfile?: string;
  position: string;
  status: string;
  appliedAt: string;
  assessment?: {
    overallScore: string;
  };
}

export default function Candidates() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    queryKey: ["/api/candidates", { search, position: positionFilter, status: statusFilter }],
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: "New", variant: "default" as const, className: "bg-blue-100 text-blue-800" },
      reviewed: { label: "Reviewed", variant: "secondary" as const, className: "bg-green-100 text-green-800" },
      interview: { label: "Interview", variant: "outline" as const, className: "bg-amber-100 text-amber-800" },
      hired: { label: "Hired", variant: "default" as const, className: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
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

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
              <p className="text-gray-600 mt-1">Manage and review job applications</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button>
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Search candidates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="All Positions" />
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
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="All Statuses" />
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
                <div>
                  <Label>Date Range</Label>
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
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
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
    </div>
  );
}
