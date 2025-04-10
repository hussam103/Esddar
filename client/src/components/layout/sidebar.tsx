import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  MenuIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";

type SidebarProps = {
  mobileMenuOpen: boolean;
  closeMobileMenu: () => void;
  activePage?: string;
};

export default function Sidebar({ mobileMenuOpen, closeMobileMenu, activePage = "/" }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/tenders", label: "Tenders", icon: ListFilter },
    { path: "/saved", label: "Saved", icon: Bookmark },
    { path: "/proposals", label: "Proposals", icon: FileText },
    { path: "/analytics", label: "Analytics", icon: BarChart2 },
    { path: "/notifications", label: "Notifications", icon: Bell },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

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
    "w-full md:w-64 bg-white border-r border-gray-200 md:h-screen md:sticky md:top-0",
    "transition-transform duration-300 ease-in-out",
    mobileMenuOpen ? "absolute inset-0 z-50" : "hidden md:block"
  );

  return (
    <aside className={sidebarClassName}>
      <div className="p-4 flex justify-between items-center md:justify-start md:flex-col md:items-start">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Esddar</span>
        </div>
        <button className="md:hidden" onClick={closeMobileMenu}>
          <X className="h-6 w-6 text-gray-600" />
        </button>
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
                      "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors duration-150",
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
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</div>
              <div className="mt-2 flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {getCompanyInitials(user.companyName)}
                </div>
                <div className="ml-2">
                  <div className="text-sm font-medium">{user.companyName}</div>
                  <div className="text-xs text-gray-500">{user.industry || "No industry specified"}</div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Log Out"}
              </Button>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
