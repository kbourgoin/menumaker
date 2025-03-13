
import { Source } from "@/types";
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
import { Badge } from "@/components/ui/badge";

interface SourceTableProps {
  sources: Source[];
  onEdit: (source: Source) => void;
  onDelete: (source: Source) => void;
}

const SourceTable = ({ sources, onEdit, onDelete }: SourceTableProps) => {
  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'book':
        return <Badge className="bg-blue-500">Book</Badge>;
      case 'website':
        return <Badge className="bg-green-500">Website</Badge>;
      case 'document':
        return <Badge className="bg-orange-500">Document</Badge>;
      default:
        return <Badge className="bg-gray-500">{type}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => (
            <TableRow key={source.id}>
              <TableCell className="font-medium">{source.name}</TableCell>
              <TableCell>{getSourceTypeLabel(source.type)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {source.description ? (
                  <span className="line-clamp-1">{source.description}</span>
                ) : (
                  <span className="text-muted-foreground italic">No description</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(source)}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(source)}
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

export default SourceTable;
