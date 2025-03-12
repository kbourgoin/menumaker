
import { useState } from "react";
import { Calendar as CalendarIcon, Search, Utensils } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import { Dish } from "@/types";

export default function AddCookedDishDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const { dishes, recordDishCooked } = useDishes();
  const { toast } = useToast();

  // Filter dishes based on search query
  const filteredDishes = dishes.filter(dish => 
    dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.cuisines.some(cuisine => 
      cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
    setSearchQuery(dish.name);
  };

  const handleCook = async () => {
    if (!selectedDish) {
      toast({
        title: "No dish selected",
        description: "Please select a dish from the search results.",
        variant: "destructive"
      });
      return;
    }

    await recordDishCooked(selectedDish.id, date.toISOString(), notes || undefined);
    toast({
      title: "Dish cooked!",
      description: `${selectedDish.name} has been recorded in your meal history.`,
    });
    
    // Reset the form
    setOpen(false);
    setSelectedDish(null);
    setSearchQuery("");
    setNotes("");
    setDate(new Date());
  };

  const resetDialog = () => {
    setSelectedDish(null);
    setSearchQuery("");
    setNotes("");
    setDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50 hover:border-terracotta-300"
        >
          <Utensils className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Cook Dish</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record a Cooked Dish</DialogTitle>
          <DialogDescription>
            Search for a dish you've cooked and record when you made it
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Search for a Dish</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {searchQuery && filteredDishes.length > 0 && !selectedDish && (
              <div className="border rounded-md mt-1 max-h-[200px] overflow-y-auto">
                {filteredDishes.map((dish) => (
                  <div 
                    key={dish.id}
                    className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectDish(dish)}
                  >
                    <div className="font-medium">{dish.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {dish.cuisines.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery && filteredDishes.length === 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                No dishes found matching "{searchQuery}"
              </div>
            )}
          </div>
          
          {selectedDish && (
            <>
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
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCook}
            className="bg-terracotta-500 hover:bg-terracotta-600"
            disabled={!selectedDish}
          >
            Record Dish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
