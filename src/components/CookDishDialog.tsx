
import { useState } from "react";
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
  dish: Dish;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  compact?: boolean;
}

export default function CookDishDialog({ 
  dish,
  variant = "outline", 
  size = "default",
  compact = false
}: CookDishDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const { recordDishCooked } = useDishes();
  const { toast } = useToast();

  const handleCook = () => {
    recordDishCooked(dish.id, date.toISOString(), notes || undefined);
    toast({
      title: "Dish cooked!",
      description: `${dish.name} has been recorded in your meal history.`,
    });
    setOpen(false);
    setNotes("");
    setDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="text-terracotta-500 border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-600"
          onClick={(e) => e.stopPropagation()}
        >
          <Utensils className="mr-1 h-4 w-4" />
          <span>{compact ? "Cook" : "Cook This"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cook {dish.name}</DialogTitle>
          <DialogDescription>
            Record when you cooked this dish and add any notes about your experience.
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
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
            onClick={handleCook}
            className="bg-terracotta-500 hover:bg-terracotta-600"
          >
            Record Dish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
