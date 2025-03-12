
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
import { useDishes } from "@/hooks/useMeals";
import { toast } from "sonner";
import { clearAllData } from "@/utils/mealUtils"; // Import local storage cleanup function

export function ClearDataDialog() {
  const { clearData } = useDishes();
  const [open, setOpen] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      // Clear data from Supabase
      await clearData();
      
      // Also clear any local storage data to prevent conflicts
      clearAllData();
      
      setOpen(false);
      toast.success("All dish data has been cleared");
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
            This will delete all dishes and dish history from the app.
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
