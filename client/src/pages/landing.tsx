import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Brain, Calendar, Mail } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Users className="text-white text-base sm:text-lg" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">RecruitPro</h1>
                <p className="text-xs sm:text-sm text-gray-500">AI Recruitment</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="text-sm px-3 py-2 sm:px-4 sm:py-2"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            AI-Powered Recruitment Platform
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto">
            Streamline your hiring process with intelligent candidate screening, 
            automated assessments, and smart interview scheduling.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button 
              size="lg" 
              className="text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto"
              onClick={() => window.location.href = '/apply'}
            >
              Apply for a Position
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto"
              onClick={() => window.location.href = '/auth'}
            >
              Admin Dashboard
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16 lg:mt-20">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Candidate Management
              </h3>
              <p className="text-gray-600 text-sm">
                Organize and track candidates with intelligent filtering and search capabilities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Resume Analysis
              </h3>
              <p className="text-gray-600 text-sm">
                Automated resume parsing and scoring using advanced AI technology.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-amber-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Interview Scheduling
              </h3>
              <p className="text-gray-600 text-sm">
                Streamlined interview management with calendar integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="text-accent text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Automated Communications
              </h3>
              <p className="text-gray-600 text-sm">
                Keep candidates informed with automated email notifications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">© 2024 RecruitPro. Powered by AI for smarter hiring decisions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
