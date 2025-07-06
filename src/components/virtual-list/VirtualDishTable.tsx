import React from "react";
import { Dish } from "@/types";
import { Table, TableBody } from "@/components/ui/table";
import DishTableHeader from "@/components/dish-table/TableHeader";
import DishTableRow from "@/components/dish-table/TableRow";
import { useTableSort } from "@/components/dish-table/useTableSort";
import { useSourceInfo } from "@/components/dish-table/useSourceInfo";
import { sortDishes } from "@/utils/dishUtils";
import { useVirtualList } from "@/hooks/useVirtualList";

interface VirtualDishTableProps {
  dishes: Dish[];
  sortOption: string;
  setSortOption: (option: string) => void;
  height?: number;
}

const ITEM_HEIGHT = 64; // Height of each table row in pixels
const DEFAULT_HEIGHT = 600; // Default container height

const VirtualDishTable = React.memo<VirtualDishTableProps>(
  ({ dishes, sortOption, setSortOption, height = DEFAULT_HEIGHT }) => {
    const { sortDirection, currentSortColumn, handleSort } = useTableSort(
      sortOption,
      setSortOption
    );
    const { sourceInfoMap } = useSourceInfo();

    // Memoize sorted dishes
    const sortedDishes = React.useMemo(() => {
      return sortDishes(dishes, sortOption);
    }, [dishes, sortOption]);

    const { scrollElementRef, items, totalHeight } = useVirtualList(
      sortedDishes,
      {
        itemHeight: ITEM_HEIGHT,
        containerHeight: height,
        overscan: 10,
      }
    );

    // Only use virtual scrolling for large datasets
    if (dishes.length < 100) {
      return (
        <div className="w-full overflow-auto">
          <Table>
            <DishTableHeader
              currentSortColumn={currentSortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <TableBody>
              {sortedDishes.map(dish => (
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
    }

    return (
      <div className="w-full">
        <Table>
          <DishTableHeader
            currentSortColumn={currentSortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </Table>
        <div
          ref={scrollElementRef}
          className="overflow-auto border rounded-md"
          style={{ height }}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {items.map(virtualItem => {
              const dish = sortedDishes[virtualItem.index];
              return (
                <div key={dish.id} style={virtualItem.style}>
                  <Table>
                    <TableBody>
                      <DishTableRow dish={dish} sourceInfoMap={sourceInfoMap} />
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

VirtualDishTable.displayName = "VirtualDishTable";

export default VirtualDishTable;
