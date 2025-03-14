
import { useState } from "react";
import { Source } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (changes: { cuisines?: string[], sourceId?: string }) => void;
  sources: Source[];
  availableCuisines: string[];
  count: number;
}

const BulkEditDialog = ({
  isOpen,
  onClose,
  onSave,
  sources,
  availableCuisines,
  count
}: BulkEditDialogProps) => {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("cuisines");
  
  const handleCuisineToggle = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };
  
  const handleSave = () => {
    const changes: { cuisines?: string[], sourceId?: string } = {};
    
    if (activeTab === "cuisines" && selectedCuisines.length > 0) {
      changes.cuisines = selectedCuisines;
    }
    
    if (activeTab === "source" && selectedSourceId) {
      changes.sourceId = selectedSourceId;
    }
    
    onSave(changes);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit {count} Dishes</DialogTitle>
          <DialogDescription>
            Update properties for multiple dishes at once.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="cuisines">Cuisines</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cuisines" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Info className="h-4 w-4" />
              <span>The selected cuisines will replace existing cuisines for all selected dishes.</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {availableCuisines.map(cuisine => (
                <div key={cuisine} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cuisine-${cuisine}`}
                    checked={selectedCuisines.includes(cuisine)}
                    onCheckedChange={() => handleCuisineToggle(cuisine)}
                  />
                  <Label
                    htmlFor={`cuisine-${cuisine}`}
                    className="text-sm cursor-pointer"
                  >
                    {cuisine}
                  </Label>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="source" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Info className="h-4 w-4" />
              <span>The selected source will be applied to all selected dishes.</span>
            </div>
            
            <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No source</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;
