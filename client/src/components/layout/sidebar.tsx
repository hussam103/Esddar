import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

import { 
  Home, 
  ListFilter, 
  Bookmark, 
  Settings, 
  X, 
  MenuIcon,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";

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
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/dashboard", label: t("nav.dashboard"), icon: Home },
    { path: "/tenders", label: t("nav.tenders"), icon: ListFilter },
    { path: "/saved", label: t("nav.saved"), icon: Bookmark },
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
    "bg-white border-r border-gray-200 md:h-screen md:sticky md:top-0",
    "transition-all duration-300 ease-in-out",
    collapsed ? "md:w-20" : "md:w-64",
    "w-full",
    mobileMenuOpen ? "absolute inset-0 z-50" : "hidden md:flex md:flex-col"
  );

  return (
    <aside className={sidebarClassName} dir="ltr">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          {!collapsed && <span className="text-xl font-bold text-gray-900">{t("app.name")}</span>}
        </div>
        <div className="flex items-center">
          <button
            className="hidden md:flex p-1 rounded hover:bg-gray-100 text-gray-600"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <button className="md:hidden ml-2" onClick={closeMobileMenu}>
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
      
      <nav className="p-4 flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-grow">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = activePage === item.path || location === item.path;
              const ItemIcon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md transition-colors duration-150",
                        collapsed ? "justify-center" : "space-x-3",
                        isActive
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <ItemIcon className="h-5 w-5" />
                      {!collapsed && <span>{item.label}</span>}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        {user && (
          <div className="pt-4 border-t border-gray-200">
            {!collapsed && (
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                {t("auth.companyName")}
              </div>
            )}
            <div className={cn("flex items-center", collapsed ? "justify-center" : "px-3")}>
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {getCompanyInitials(user.companyName)}
              </div>
              {!collapsed && (
                <div className="ml-2">
                  <div className="text-sm font-medium">{user.companyName}</div>
                  <div className="text-xs text-gray-500">{user.industry || t("settings.profile")}</div>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              className={cn("mt-4", collapsed ? "w-10 h-10 p-0 mx-auto flex items-center justify-center" : "w-full")}
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              title={collapsed ? t("auth.logout") : undefined}
            >
              {collapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              ) : (
                logoutMutation.isPending 
                  ? `${t("auth.logout")}...` 
                  : t("auth.logout")
              )}
            </Button>
          </div>
        )}
      </nav>
    </aside>
  );
}
