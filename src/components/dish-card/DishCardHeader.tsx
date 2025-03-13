
import { CardHeader, CardTitle } from "@/components/ui/card";

interface DishCardHeaderProps {
  name: string;
  compact?: boolean;
}

const DishCardHeader = ({ name, compact = false }: DishCardHeaderProps) => {
  return (
    <CardHeader className={compact ? "pb-2 pt-4 px-4" : "pb-4"}>
      <CardTitle className={`line-clamp-1 text-lg ${compact ? "text-base" : "text-xl"}`}>
        {name}
      </CardTitle>
    </CardHeader>
  );
};

export default DishCardHeader;
