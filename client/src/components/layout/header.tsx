import { useAuth } from "@/hooks/use-auth";
import NotificationsDropdown from "./notifications-dropdown";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { MenuIcon } from "lucide-react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  toggleMobileMenu: () => void;
};

export default function Header({ title, subtitle, toggleMobileMenu }: HeaderProps) {
  const { user } = useAuth();

  // Function to get company initials
  const getCompanyInitials = (name: string): string => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3 mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <NotificationsDropdown />
          
          {user && (
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium cursor-pointer">
              {getCompanyInitials(user.companyName)}
            </div>
          )}
          
          <button className="md:hidden p-2 text-gray-600" onClick={toggleMobileMenu}>
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
