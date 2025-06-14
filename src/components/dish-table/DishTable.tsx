
import { Dish } from "@/types";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import DishTableHeader from "./TableHeader";
import DishTableRow from "./TableRow";
import { useTableSort } from "./useTableSort";
import { useSourceInfo } from "./useSourceInfo";
import { sortDishes } from "@/utils/dishUtils";

interface DishTableProps {
  dishes: Dish[];
  sortOption: string;
  setSortOption: (option: string) => void;
}

const DishTable = ({ dishes, sortOption, setSortOption }: DishTableProps) => {
  const { sortDirection, currentSortColumn, handleSort } = useTableSort(sortOption, setSortOption);
  const { sourceInfoMap } = useSourceInfo();
  
  // Sort the dishes based on the current sort option
  const sortedDishes = sortDishes(dishes, sortOption);
  
  return (
    <div className="w-full overflow-auto">
      <Table>
        <DishTableHeader 
          currentSortColumn={currentSortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <TableBody>
          {sortedDishes.map((dish) => (
            <DishTableRow 
              key={dish.id} 
              dish={dish} 
              sourceInfoMap={sourceInfoMap}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DishTable;
