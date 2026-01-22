import { useState } from "react";
import { Calendar as CalendarIcon, CalendarPlus } from "lucide-react";
import { format, addDays } from "date-fns";
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

interface PlanMealDialogProps {
  dish: Dish | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PlanMealDialog({
  dish,
  open,
  onOpenChange,
  onSuccess,
}: PlanMealDialogProps) {
  // Default to tomorrow for planning
  const [date, setDate] = useState<Date>(addDays(new Date(), 1));
  const [notes, setNotes] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { recordDishCooked } = useDishes();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!dish) return;

    try {
      setIsSubmitting(true);
      await recordDishCooked(dish.id, date.toISOString(), notes.trim() || null);

      toast({
        title: "Meal planned!",
        description: `${dish.name} scheduled for ${format(date, "EEEE, MMMM d")}.`,
      });

      // Reset form
      setDate(addDays(new Date(), 1));
      setNotes("");
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error planning meal:", error);
      toast({
        title: "Error",
        description: "Failed to plan the meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (newDate?: Date) => {
    if (newDate) {
      setDate(newDate);
      setPopoverOpen(false);
    }
  };

  // Quick date buttons
  const quickDates = [
    { label: "Tomorrow", date: addDays(new Date(), 1) },
    { label: "This Weekend", date: getNextWeekend() },
    { label: "Next Week", date: addDays(new Date(), 7) },
  ];

  if (!dish) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-terracotta-500" />
            Plan: {dish.name}
          </DialogTitle>
          <DialogDescription>
            Schedule when you want to cook this dish.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Quick date buttons */}
          <div className="flex flex-wrap gap-2">
            {quickDates.map(({ label, date: quickDate }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                onClick={() => setDate(quickDate)}
                className={cn(
                  "text-xs",
                  format(date, "yyyy-MM-dd") === format(quickDate, "yyyy-MM-dd")
                    ? "bg-terracotta-100 border-terracotta-300"
                    : ""
                )}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Date picker */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Date</label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Shopping list, variations to try, who's coming for dinner..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-terracotta-500 hover:bg-terracotta-600"
          >
            {isSubmitting ? "Planning..." : "Plan Meal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Get the next Saturday */
function getNextWeekend(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  return addDays(today, daysUntilSaturday);
}
