import React from "react";
import { cn } from "@/lib/utils";
import { SARIcon } from "./sar-icon";

interface CurrencyProps {
  amount: number;
  showDecimal?: boolean;
  className?: string;
  locale?: string;
}

export function SARCurrency({
  amount,
  showDecimal = true,
  className,
  locale = "ar-SA", // Default to Saudi locale
}: CurrencyProps) {
  const formattedAmount = showDecimal 
    ? amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString(locale);

  return (
    <span className={cn("whitespace-nowrap flex items-center gap-1 font-medium", className)}>
      <span>
        {formattedAmount}
      </span>
      <SARIcon className="text-primary" size={16} />
    </span>
  );
}

// This function returns a formatted string with the SAR symbol
// Used for string-based displays where React components can't be used
export function formatSAR(amount: number, language: "ar" | "en" = "ar", showDecimal = false) {
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const formattedAmount = showDecimal 
    ? amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString(locale);
  
  // Using the Arabic Riyal symbol (﷼) for string contexts
  return `${formattedAmount} ﷼`;
}