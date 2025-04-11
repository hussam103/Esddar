import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

type TenderFilterProps = {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
};

export default function TenderFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedSort,
  onSortChange
}: TenderFilterProps) {
  const { t, language } = useLanguage();
  
  // Get sort options based on current language
  const matchPercentageText = t("tenders.matchPercentage");
  const deadlineClosestText = t("tenders.deadlineClosest");
  const valueHighestText = t("tenders.valueHighest");
  const recentlyAddedText = t("tenders.recentlyAdded");
  
  const sortOptions = [
    matchPercentageText,
    deadlineClosestText,
    valueHighestText,
    recentlyAddedText
  ];

  // Style for RTL/LTR select elements
  const isRTL = language === "ar";
  const selectClassName = `${isRTL ? 'pr-3 pl-8' : 'pl-3 pr-8'} py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none`;
  const iconPosition = isRTL ? "left-0" : "right-0";
  const iconPadding = isRTL ? "pl-2" : "pr-2";

  return (
    <div className="flex items-center justify-between mb-4">
      <div className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
        <div className="relative">
          <select 
            className={selectClassName}
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className={`absolute inset-y-0 ${iconPosition} flex items-center ${iconPadding} pointer-events-none`}>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="relative">
          <select 
            className={selectClassName}
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {t("tenders.sortBy")}: {option}
              </option>
            ))}
          </select>
          <div className={`absolute inset-y-0 ${iconPosition} flex items-center ${iconPadding} pointer-events-none`}>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 hidden md:block">
        {t("tenders.showingCategories").replace("<count>", (categories.length - 1).toString())}
      </div>
    </div>
  );
}
