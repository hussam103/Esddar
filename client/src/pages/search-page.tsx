import { useState } from "react";
import CompanyProfileSearch from "@/components/search/company-profile-search";
import { useLanguage } from "@/hooks/use-language";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function SearchPage() {
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row" dir={language === "ar" ? "rtl" : "ltr"}>
      <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title={t("Tender Search")} 
          subtitle={t("Find the perfect tenders for your business")}
          toggleMobileMenu={toggleMobileMenu}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <CompanyProfileSearch />
        </div>
      </main>
    </div>
  );
}