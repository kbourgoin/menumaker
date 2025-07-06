import { CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface DishCardHeaderProps {
  name: string;
  dishId: string;
  compact?: boolean;
}

const DishCardHeader = ({
  name,
  dishId,
  compact = false,
}: DishCardHeaderProps) => {
  return (
    <CardHeader className={compact ? "pb-2 pt-4 px-4" : "pb-4"}>
      <Link to={`/meal/${dishId}`} className="hover:underline">
        <CardTitle
          className={`line-clamp-1 text-lg ${compact ? "text-base" : "text-xl"}`}
        >
          {name}
        </CardTitle>
      </Link>
    </CardHeader>
  );
};

export default DishCardHeader;
