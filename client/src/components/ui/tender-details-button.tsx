import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";

type TenderDetailsButtonProps = {
  tenderId: number;
  className?: string;
};

/**
 * A consistent button for viewing tender details across all tender cards
 */
export function TenderDetailsButton({ tenderId, className = "" }: TenderDetailsButtonProps) {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  
  return (
    <button 
      className={`text-sm text-primary-600 font-medium hover:text-primary-700 rtl:text-right whitespace-nowrap min-w-[95px] inline-flex ${language === "ar" ? "justify-end" : "justify-start"} ${className}`}
      onClick={() => setLocation(`/tenders/${tenderId}`)}
    >
      {t("tenders.viewDetails")}
    </button>
  );
}