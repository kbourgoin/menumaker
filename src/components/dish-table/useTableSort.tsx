
import { useEffect, useState } from "react";
import { Column, SortDirection } from "./types";

const columnToSortMap: Record<Column, string> = {
  name: "name",
  source: "source",
  cuisine: "cuisine",
  timesCooked: "timesCooked",
  lastMade: "lastCooked",
  comment: "lastComment"
};

export const useTableSort = (sortOption: string, setSortOption: (option: string) => void) => {
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Determine current sort column from sortOption
  const getCurrentSortColumn = (): Column => {
    const baseSort = sortOption.replace(/^asc_/, "");
    // Find the column key that maps to this sort option
    return (Object.entries(columnToSortMap) as [Column, string][])
      .find(([, value]) => value === baseSort)?.[0] || "name";
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
  
  // Determine current sort direction
  useEffect(() => {
    if (sortOption.startsWith("asc_")) {
      setSortDirection("asc");
    } else {
      setSortDirection("desc");
    }
  }, [sortOption]);
  
  return {
    sortDirection,
    currentSortColumn: getCurrentSortColumn(),
    handleSort
  };
};
