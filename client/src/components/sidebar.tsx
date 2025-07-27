import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { 
  Users as UsersIcon, 
  BarChart3, 
  Bus, 
  FileText, 
  Calendar, 
  Mail, 
  Brain,
  Briefcase,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const getNavigationItems = (t: (key: any) => string) => [
  {
    name: t("dashboard"),
    href: "/",
    icon: BarChart3,
  },
  {
    name: t("candidates"),
    href: "/candidates",
    icon: Bus,
  },
  {
    name: t("applicationForm"),
    href: "/apply",
    icon: FileText,
  },
  {
    name: t("interviews"),
    href: "/interviews",
    icon: Calendar,
  },
  {
    name: t("emailHistory"),
    href: "/emails",
    icon: Mail,
  },
  {
    name: t("assessments"),
    href: "/assessments",
    icon: Brain,
  },
  {
    name: t("jobDescriptions"),
    href: "/job-descriptions",
    icon: Briefcase,
  },
  {
    name: t("users"),
    href: "/users",
    icon: UsersIcon,
  },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigationItems = getNavigationItems(t);

  // Auto-close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <UsersIcon className="text-white text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{t("recruitPro")}</h1>
              <p className="text-sm text-gray-500 truncate">{t("aiRecruitment")}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 pb-20">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-200 cursor-pointer touch-manipulation",
                    "min-h-[48px] text-base lg:text-sm", // Improved touch targets for mobile
                    isActive
                      ? "bg-blue-50 text-primary font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  )}
                  onClick={closeMobileMenu}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate flex-1">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "Admin"} />
              <AvatarFallback>
                {user?.firstName?.[0] || "A"}{user?.lastName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || "Admin User"
                }
              </p>
              <p className="text-xs text-gray-500 truncate">{t("hrManager")}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          data-sidebar="mobile-button"
          variant="outline"
          size="sm"
          onClick={toggleMobileMenu}
          className={cn(
            "bg-white shadow-md border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200",
            isMobileMenuOpen && "bg-gray-50 border-gray-400"
          )}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Desktop Sidebar - Always visible on large screens */}
      <nav className="hidden lg:block fixed left-0 top-0 w-64 h-screen bg-white shadow-lg z-30 overflow-y-auto">
        {renderSidebarContent()}
      </nav>

      {/* Mobile Sidebar - Slide overlay */}
      <nav
        className={cn(
          "lg:hidden fixed left-0 top-0 w-64 h-screen bg-white shadow-lg z-40 overflow-y-auto transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {renderSidebarContent()}
      </nav>
    </>
  );
}
