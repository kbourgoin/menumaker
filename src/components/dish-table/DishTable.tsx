
import React from "react";
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

const DishTable = React.memo<DishTableProps>(({ dishes, sortOption, setSortOption }) => {
  const { sortDirection, currentSortColumn, handleSort } = useTableSort(sortOption, setSortOption);
  const { sourceInfoMap } = useSourceInfo();
  
  // Memoize sorted dishes to avoid recalculating on every render
  const sortedDishes = React.useMemo(() => {
    return sortDishes(dishes, sortOption);
  }, [dishes, sortOption]);
  
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
});

DishTable.displayName = 'DishTable';

export default DishTable;
