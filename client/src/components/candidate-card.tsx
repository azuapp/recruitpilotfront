import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  Download, 
  Mail, 
  Calendar,
  MapPin,
  Phone,
  Linkedin
} from "lucide-react";

interface CandidateCardProps {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    linkedinProfile?: string;
    position: string;
    status: string;
    appliedAt: string;
    cvFileName?: string;
    assessment?: {
      overallScore: string;
      technicalSkills?: string;
      experienceMatch?: string;
      education?: string;
    };
  };
  onViewDetails?: (id: string) => void;
  onDownloadCV?: (id: string) => void;
  onSendEmail?: (id: string) => void;
  onScheduleInterview?: (id: string) => void;
}

export default function CandidateCard({ 
  candidate, 
  onViewDetails,
  onDownloadCV,
  onSendEmail,
  onScheduleInterview
}: CandidateCardProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: "New", className: "bg-blue-100 text-blue-800" },
      reviewed: { label: "Reviewed", className: "bg-green-100 text-green-800" },
      interview: { label: "Interview", className: "bg-amber-100 text-amber-800" },
      hired: { label: "Hired", className: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.new;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatPosition = (position: string) => {
    return position.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const overallScore = candidate.assessment?.overallScore 
    ? parseInt(candidate.assessment.overallScore) 
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-white">
                {getInitials(candidate.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {candidate.fullName}
              </h3>
              <p className="text-sm text-gray-600">
                {formatPosition(candidate.position)}
              </p>
            </div>
          </div>
          {getStatusBadge(candidate.status)}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{candidate.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{candidate.phone}</span>
          </div>
          {candidate.linkedinProfile && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Linkedin className="w-4 h-4" />
              <a 
                href={candidate.linkedinProfile} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
        </div>

        {/* Applied Date */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Calendar className="w-4 h-4" />
          <span>Applied: {new Date(candidate.appliedAt).toLocaleDateString()}</span>
        </div>

        {/* AI Assessment Score */}
        {candidate.assessment && overallScore !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">AI Assessment Score</span>
              <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </span>
            </div>
            <Progress value={overallScore} className="h-2" />
            
            {/* Detailed Scores */}
            {candidate.assessment.technicalSkills && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div>
                  <span className="text-gray-600">Technical:</span>
                  <span className="ml-1 font-medium">
                    {candidate.assessment.technicalSkills}%
                  </span>
                </div>
                {candidate.assessment.experienceMatch && (
                  <div>
                    <span className="text-gray-600">Experience:</span>
                    <span className="ml-1 font-medium">
                      {candidate.assessment.experienceMatch}%
                    </span>
                  </div>
                )}
                {candidate.assessment.education && (
                  <div>
                    <span className="text-gray-600">Education:</span>
                    <span className="ml-1 font-medium">
                      {candidate.assessment.education}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(candidate.id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          
          {candidate.cvFileName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadCV?.(candidate.id)}
            >
              <Download className="w-4 h-4 mr-1" />
              CV
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendEmail?.(candidate.id)}
          >
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
          
          {candidate.status !== 'hired' && candidate.status !== 'rejected' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScheduleInterview?.(candidate.id)}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Interview
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
