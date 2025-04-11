import React from "react";
import { cn } from "@/lib/utils";

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
      <span className="font-bold">﷼</span>
    </span>
  );
}

export function formatSAR(amount: number, showDecimal = false, locale = "ar-SA") {
  const formattedAmount = showDecimal 
    ? amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString(locale);
  
  return `${formattedAmount} ﷼`;
}