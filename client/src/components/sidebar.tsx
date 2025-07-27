import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users as UsersIcon, 
  BarChart3, 
  Bus, 
  FileText, 
  Calendar, 
  Mail, 
  Brain,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Candidates",
    href: "/candidates",
    icon: Bus,
  },
  {
    name: "Application Form",
    href: "/apply",
    icon: FileText,
  },
  {
    name: "Interviews",
    href: "/interviews",
    icon: Calendar,
  },
  {
    name: "Email History",
    href: "/emails",
    icon: Mail,
  },
  {
    name: "AI Assessments",
    href: "/assessments",
    icon: Brain,
  },
  {
    name: "User Management",
    href: "/users",
    icon: UsersIcon,
  },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobileMenu}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white shadow-lg z-30 h-screen overflow-y-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <UsersIcon className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">RecruitPro</h1>
              <p className="text-sm text-gray-500">AI Recruitment</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-blue-50 text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={cn(
                      isActive ? "font-medium" : ""
                    )}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "Admin"} />
              <AvatarFallback>
                {user?.firstName?.[0] || "A"}{user?.lastName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || "Admin User"
                }
              </p>
              <p className="text-xs text-gray-500">HR Manager</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
