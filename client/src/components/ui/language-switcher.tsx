import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { Globe } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("ar")} className={language === "ar" ? "bg-muted" : ""}>
          <span className="flex items-center">
            {language === "ar" && <span className="mr-2 text-primary">✓</span>}
            {t("settings.language.ar")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-muted" : ""}>
          <span className="flex items-center">
            {language === "en" && <span className="mr-2 text-primary">✓</span>}
            {t("settings.language.en")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}