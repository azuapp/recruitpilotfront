import { useState } from "react";
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
          className="bg-white shadow-md border-2 border-gray-300 hover:bg-gray-50"
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
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 touch-manipulation"
          onClick={closeMobileMenu}
          aria-label="Close mobile menu"
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white shadow-lg z-40 h-screen overflow-y-auto",
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
              <h1 className="text-xl font-bold text-gray-900">{t("recruitPro")}</h1>
              <p className="text-sm text-gray-500">{t("aiRecruitment")}</p>
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
                    "flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-200 cursor-pointer block touch-manipulation",
                    "min-h-[48px] text-base lg:text-sm", // Improved touch targets for mobile
                    isActive
                      ? "bg-blue-50 text-primary font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  )}
                  onClick={closeMobileMenu}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">
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
              <p className="text-xs text-gray-500">{t("hrManager")}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
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
