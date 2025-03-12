
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
import { useMeals } from "@/hooks/useMeals";
import { toast } from "sonner";

export function ClearDataDialog() {
  const { clearData } = useMeals();
  const [open, setOpen] = React.useState(false);

  const handleClearData = () => {
    clearData();
    setOpen(false);
    toast.success("All meal data has been cleared");
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
            This will delete all meals and meal history from the app.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClearData}>
            Clear All Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
