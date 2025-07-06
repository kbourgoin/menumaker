
import { CuisineTag } from "@/components/shared";

interface CuisinesListProps {
  cuisines: string[];
  compact?: boolean;
}

const CuisinesList = ({ cuisines, compact = false }: CuisinesListProps) => {
  if (compact && cuisines.length > 0) {
    return <CuisineTag cuisine={cuisines[0]} size="sm" />;
  }

  if (cuisines.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {cuisines.map((cuisine) => (
        <CuisineTag key={cuisine} cuisine={cuisine} size={compact ? "sm" : "md"} />
      ))}
    </div>
  );
};

export default CuisinesList;
