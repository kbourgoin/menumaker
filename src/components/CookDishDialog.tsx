
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Utensils } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Dish } from "@/types";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";

interface CookDishDialogProps {
  dish: Pick<Dish, 'id' | 'name'>;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  compact?: boolean;
  children?: React.ReactNode;
  editMode?: boolean;
  historyEntryId?: string;
  initialDate?: Date;
  initialNotes?: string;
}

export default function CookDishDialog({ 
  dish,
  variant = "outline", 
  size = "default",
  compact = false,
  children,
  editMode = false,
  historyEntryId,
  initialDate,
  initialNotes = ""
}: CookDishDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [notes, setNotes] = useState(initialNotes);
  const { recordDishCooked, updateMealHistory } = useDishes();
  const { toast } = useToast();

  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialNotes) setNotes(initialNotes);
  }, [initialDate, initialNotes]);

  const handleSubmit = async () => {
    try {
      if (editMode && historyEntryId) {
        await updateMealHistory(historyEntryId, {
          date: date.toISOString(),
          notes: notes || undefined
        });
        toast({
          title: "Entry updated",
          description: "The cooking history entry has been updated.",
        });
      } else {
        await recordDishCooked(dish.id, date.toISOString(), notes || undefined);
        toast({
          title: "Dish cooked!",
          description: `${dish.name} has been recorded in your meal history.`,
        });
      }
      setOpen(false);
      setNotes("");
      if (!editMode) setDate(new Date());
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save the entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const triggerContent = children || (
    <>
      <Utensils className="mr-1 h-4 w-4" />
      <span>{compact ? "Cook" : editMode ? "Edit Entry" : "Cook This"}</span>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={cn(
            "text-terracotta-500 border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-600",
            { "w-full": size === "icon" }
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {triggerContent}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Cooking Entry" : `Cook ${dish.name}`}</DialogTitle>
          <DialogDescription>
            {editMode 
              ? "Update when you cooked this dish and any notes about your experience."
              : "Record when you cooked this dish and add any notes about your experience."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Date Cooked</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Any variations or notes about this meal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-terracotta-500 hover:bg-terracotta-600"
          >
            {editMode ? "Save Changes" : "Record Dish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
