
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDataImport } from "@/hooks/useDataImport";
import { toast } from "sonner";

export function ClearDataDialog() {
  const { clearData } = useDataImport();
  const [open, setOpen] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      // Clear data from Supabase
      const result = await clearData();
      
      if (result.success) {
        setOpen(false);
        toast.success("All dish data has been cleared from the database");
      } else {
        toast.error("Failed to clear data. Please try again.");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Reset App Data</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear All Data</DialogTitle>
          <DialogDescription>
            This will delete all dishes and dish history from the database.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleClearData} 
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Clear All Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
