import { CuisineType } from "@/types";
import { cn } from "@/lib/utils";

interface CuisineTagProps {
  cuisine: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

// Color mapping for different cuisines
const cuisineColors: Record<string, string> = {
  Italian: "bg-red-50 text-red-700 border-red-200",
  Mexican: "bg-green-50 text-green-700 border-green-200",
  American: "bg-blue-50 text-blue-700 border-blue-200",
  Asian: "bg-purple-50 text-purple-700 border-purple-200",
  Mediterranean: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Indian: "bg-orange-50 text-orange-700 border-orange-200",
  French: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Greek: "bg-sky-50 text-sky-700 border-sky-200",
  Thai: "bg-lime-50 text-lime-700 border-lime-200",
  Japanese: "bg-pink-50 text-pink-700 border-pink-200",
  Chinese: "bg-red-50 text-red-700 border-red-200",
  Korean: "bg-violet-50 text-violet-700 border-violet-200",
  "Middle Eastern": "bg-amber-50 text-amber-700 border-amber-200",
  Vietnamese: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Spanish: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Caribbean: "bg-teal-50 text-teal-700 border-teal-200",
  German: "bg-gray-50 text-gray-700 border-gray-200",
  British: "bg-slate-50 text-slate-700 border-slate-200",
  Fusion: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  Other: "bg-stone-50 text-stone-700 border-stone-200",
};

const CuisineTag = ({ cuisine, size = "md", onClick }: CuisineTagProps) => {
  const colors =
    cuisineColors[cuisine] || "bg-gray-100 text-gray-800 border-gray-200";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium transition-colors",
        colors,
        sizeClasses[size],
        onClick && "cursor-pointer hover:opacity-80"
      )}
      onClick={onClick}
    >
      {cuisine}
    </span>
  );
};

export default CuisineTag;
