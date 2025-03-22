
import { Link } from "react-router-dom";
import { Dish } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import TableColumnHeader from "./TableColumnHeader";
import { Column, SortDirection } from "./types";
import { useState, useEffect } from "react";
import SourceInfo from "../dish-card/SourceInfo";

interface DishTableProps {
  dishes: Dish[];
  sortOption: string;
  setSortOption: (option: string) => void;
}

const DishTable = ({ dishes, sortOption, setSortOption }: DishTableProps) => {
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Map between column identifiers and sort options
  const columnToSortMap: Record<Column, string> = {
    name: "name",
    source: "source",
    cuisine: "cuisine",
    timesCooked: "timesCooked",
    lastMade: "lastCooked",
    comment: "lastComment"
  };
  
  // Handle the sort when a column header is clicked
  const handleSort = (column: Column) => {
    const sortKey = columnToSortMap[column];
    
    if (sortOption === sortKey) {
      // If already sorting by this column, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // If sorting by a new column, set it and reset direction to desc
      setSortOption(sortKey);
      setSortDirection("desc");
    }
  };
  
  // Update external sort when direction changes
  useEffect(() => {
    // This is a bit of a hack - we're using the same sortOption state from the parent
    // but adding direction by prefixing with 'asc_' when needed
    if (sortDirection === "asc") {
      const baseSort = sortOption.replace(/^asc_/, "");
      setSortOption(`asc_${baseSort}`);
    } else {
      // Remove any 'asc_' prefix
      setSortOption(sortOption.replace(/^asc_/, ""));
    }
  }, [sortDirection, sortOption, setSortOption]);
  
  // Determine current sort column from sortOption
  const getCurrentSortColumn = (): Column => {
    const baseSort = sortOption.replace(/^asc_/, "");
    // Find the column key that maps to this sort option
    return (Object.entries(columnToSortMap) as [Column, string][])
      .find(([, value]) => value === baseSort)?.[0] || "name";
  };
  
  // Determine current sort direction
  useEffect(() => {
    if (sortOption.startsWith("asc_")) {
      setSortDirection("asc");
    } else {
      setSortDirection("desc");
    }
  }, [sortOption]);
  
  const currentSortColumn = getCurrentSortColumn();
  
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableColumnHeader 
              column="name" 
              currentSort={currentSortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="w-1/4"
            >
              Name
            </TableColumnHeader>
            
            <TableColumnHeader 
              column="source" 
              currentSort={currentSortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="w-1/5"
            >
              Source
            </TableColumnHeader>
            
            <TableColumnHeader 
              column="cuisine" 
              currentSort={currentSortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Cuisine
            </TableColumnHeader>
            
            <TableColumnHeader 
              column="timesCooked" 
              className="text-right"
              currentSort={currentSortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Times Made
            </TableColumnHeader>
            
            <TableColumnHeader 
              column="lastMade" 
              currentSort={currentSortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Last Made
            </TableColumnHeader>
            
            <TableColumnHeader 
              column="comment" 
              currentSort={currentSortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="w-1/4"
            >
              Latest Comment
            </TableColumnHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dishes.map((dish) => (
            <TableRow key={dish.id}>
              <TableCell>
                <Link 
                  to={`/meal/${dish.id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {dish.name}
                </Link>
              </TableCell>
              <TableCell className="max-w-[200px] break-words">
                <SourceInfo sourceId={dish.sourceId} location={dish.location} />
              </TableCell>
              <TableCell>{dish.cuisines.join(", ")}</TableCell>
              <TableCell className="text-right">{dish.timesCooked || 0}</TableCell>
              <TableCell>
                {dish.lastMade 
                  ? formatDate(new Date(dish.lastMade)) 
                  : "Never"}
              </TableCell>
              <TableCell className="max-w-md">
                {dish.lastComment && (
                  <p className="text-sm text-muted-foreground italic break-words">
                    "{dish.lastComment}"
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DishTable;
