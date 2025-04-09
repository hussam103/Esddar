import { ChevronDown } from "lucide-react";

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
  const sortOptions = [
    "Match Score",
    "Deadline (Earliest)",
    "Value (Highest)",
    "Recently Added"
  ];

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <select 
            className="pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="relative">
          <select 
            className="pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                Sort by: {option}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 hidden md:block">
        Showing <span className="font-medium">{categories.length - 1}</span> categories
      </div>
    </div>
  );
}
