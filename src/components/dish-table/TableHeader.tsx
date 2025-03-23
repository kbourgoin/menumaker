
import { TableHeader as UITableHeader, TableRow } from "@/components/ui/table";
import TableColumnHeader from "./TableColumnHeader";
import { Column, SortDirection } from "./types";

interface DishTableHeaderProps {
  currentSortColumn: Column;
  sortDirection: SortDirection;
  onSort: (column: Column) => void;
}

const DishTableHeader = ({ 
  currentSortColumn, 
  sortDirection, 
  onSort 
}: DishTableHeaderProps) => {
  return (
    <UITableHeader>
      <TableRow>
        <TableColumnHeader 
          column="name" 
          currentSort={currentSortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
          className="w-1/4"
        >
          Name
        </TableColumnHeader>
        
        <TableColumnHeader 
          column="source" 
          currentSort={currentSortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
          className="w-1/5"
        >
          Source
        </TableColumnHeader>
        
        <TableColumnHeader 
          column="cuisine" 
          currentSort={currentSortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          Cuisine
        </TableColumnHeader>
        
        <TableColumnHeader 
          column="timesCooked" 
          className="text-right"
          currentSort={currentSortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          Times Made
        </TableColumnHeader>
        
        <TableColumnHeader 
          column="lastMade" 
          currentSort={currentSortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          Last Made
        </TableColumnHeader>
        
        <TableColumnHeader 
          column="comment" 
          currentSort={currentSortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
          className="w-1/4"
        >
          Latest Comment
        </TableColumnHeader>
      </TableRow>
    </UITableHeader>
  );
};

export default DishTableHeader;
