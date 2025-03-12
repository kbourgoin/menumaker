
import { Cookbook } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon } from "lucide-react";

interface CookbookTableProps {
  cookbooks: Cookbook[];
  onEdit: (cookbook: Cookbook) => void;
  onDelete: (cookbook: Cookbook) => void;
}

const CookbookTable = ({ cookbooks, onEdit, onDelete }: CookbookTableProps) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Author</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cookbooks.map((cookbook) => (
            <TableRow key={cookbook.id}>
              <TableCell className="font-medium">{cookbook.name}</TableCell>
              <TableCell>{cookbook.author || "-"}</TableCell>
              <TableCell className="hidden md:table-cell">
                {cookbook.description ? (
                  <span className="line-clamp-1">{cookbook.description}</span>
                ) : (
                  <span className="text-muted-foreground italic">No description</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(cookbook)}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(cookbook)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CookbookTable;
