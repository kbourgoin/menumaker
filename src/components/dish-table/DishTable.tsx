
import { Link } from "react-router-dom";
import { Dish } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface DishTableProps {
  dishes: Dish[];
}

const DishTable = ({ dishes }: DishTableProps) => {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Cuisine</TableHead>
            <TableHead className="text-right">Times Made</TableHead>
            <TableHead>Last Made</TableHead>
            <TableHead>Latest Comment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dishes.map((dish) => (
            <TableRow key={dish.id}>
              <TableCell>
                <Link 
                  to={`/edit-meal/${dish.id}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {dish.name}
                </Link>
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
