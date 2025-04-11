import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

import { 
  Home, 
  ListFilter, 
  Bookmark, 
  FileText, 
  BarChart2, 
  Bell, 
  Settings, 
  X, 
  MenuIcon,
  ShieldAlert
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

type SidebarProps = {
  mobileMenuOpen: boolean;
  closeMobileMenu: () => void;
  activePage?: string;
};

export default function Sidebar({ mobileMenuOpen, closeMobileMenu, activePage = "/" }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { path: "/dashboard", label: t("nav.dashboard"), icon: Home },
    { path: "/tenders", label: t("nav.tenders"), icon: ListFilter },
    { path: "/saved", label: t("nav.saved"), icon: Bookmark },
    { path: "/proposals", label: t("nav.applications"), icon: FileText },
    { path: "/analytics", label: t("dashboard.activeTenders"), icon: BarChart2 },
    { path: "/notifications", label: "الإشعارات", icon: Bell },
    { path: "/settings", label: t("nav.settings"), icon: Settings },
  ];
  
  // Add admin menu item only for admin user
  if (isAdmin) {
    navItems.push({ path: "/admin", label: t("nav.admin"), icon: ShieldAlert });
  }

  // Function to get company initials
  const getCompanyInitials = (name: string): string => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const sidebarClassName = cn(
    "w-full md:w-64 bg-white border-l border-gray-200 md:h-screen md:sticky md:top-0",
    "transition-transform duration-300 ease-in-out",
    mobileMenuOpen ? "absolute inset-0 z-50" : "hidden md:block"
  );

  return (
    <aside className={sidebarClassName} dir="rtl">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">إ</span>
          </div>
          <span className="text-xl font-bold text-gray-900">{t("app.name")}</span>
        </div>
        <div className="flex items-center">
          <LanguageSwitcher />
          <button className="md:hidden ml-2" onClick={closeMobileMenu}>
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = activePage === item.path || location === item.path;
            const ItemIcon = item.icon;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-md transition-colors duration-150",
                      isActive
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <ItemIcon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
        
        {user && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("auth.companyName")}</div>
              <div className="mt-2 flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {getCompanyInitials(user.companyName)}
                </div>
                <div className="mr-2">
                  <div className="text-sm font-medium">{user.companyName}</div>
                  <div className="text-xs text-gray-500">{user.industry || t("settings.profile")}</div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending 
                  ? `${t("auth.logout")}...` 
                  : t("auth.logout")}
              </Button>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
