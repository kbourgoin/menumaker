
import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Shuffle, Plus, RefreshCw } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import DishCard from "@/components/dish-card";
import { Dish } from "@/types";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWeeklyMenu } from "@/hooks/useWeeklyMenu";

const WeeklyMenu = () => {
  const { allDishes, isLoading, getWeeklyDishSuggestions } = useWeeklyMenu();
  const { toast } = useToast();
  const [weeklyDishes, setWeeklyDishes] = useState<Dish[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshingDayIndex, setRefreshingDayIndex] = useState<number | null>(null);
  
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const generateWeeklyMenu = useCallback(async () => {
    if (!allDishes || allDishes.length === 0) {
      toast({
        title: "No dishes available",
        description: "Add some dishes first to generate a weekly menu.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      const suggestions = await getWeeklyDishSuggestions(7);
      setWeeklyDishes(suggestions);
      
      toast({
        title: "Weekly menu generated",
        description: "Based on your meal history and preferences.",
      });
    } catch (error) {
      console.error("Error generating menu:", error);
      toast({
        title: "Error generating menu",
        description: "There was a problem generating your weekly menu.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [allDishes, getWeeklyDishSuggestions, toast]);
  
  useEffect(() => {
    // Only generate menu when dishes are loaded and not already generating
    if (!isLoading && allDishes && allDishes.length > 0 && !isGenerating && weeklyDishes.length === 0) {
      generateWeeklyMenu();
    }
  }, [isLoading, allDishes, isGenerating, weeklyDishes.length, generateWeeklyMenu]);

  const refreshDayDish = async (dayIndex: number) => {
    if (!allDishes || allDishes.length === 0) return;
    
    try {
      setRefreshingDayIndex(dayIndex);
      // Generate just 1 new dish suggestion
      const newSuggestion = await getWeeklyDishSuggestions(1);
      
      if (newSuggestion.length > 0) {
        // Replace the dish for the selected day
        const updatedDishes = [...weeklyDishes];
        updatedDishes[dayIndex] = newSuggestion[0];
        setWeeklyDishes(updatedDishes);
        
        toast({
          title: "New suggestion added",
          description: `${newSuggestion[0].name} added to ${format(weekDates[dayIndex], "EEEE")}.`,
        });
      }
    } catch (error) {
      console.error("Error refreshing day suggestion:", error);
      toast({
        title: "Error refreshing suggestion",
        description: "There was a problem generating a new suggestion.",
        variant: "destructive",
      });
    } finally {
      setRefreshingDayIndex(null);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 animate-slide-down">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">Weekly Menu</h1>
            <p className="text-muted-foreground">
              Plan your meals for the week of {format(weekStart, "MMMM d, yyyy")}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={generateWeeklyMenu}
              className="border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50"
              disabled={isLoading || !allDishes || allDishes.length === 0 || isGenerating}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </div>
        
        {isLoading || isGenerating ? (
          <div className="py-12 text-center">
            <div className="animate-pulse text-lg">Loading your dish data...</div>
          </div>
        ) : !allDishes || allDishes.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground animate-fade-in">
            <Calendar className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium mb-1">No dishes in your collection yet</h3>
            <p>Add some dishes first to create a weekly menu plan.</p>
            <Link to="/add-meal" className="mt-4 inline-block">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600 mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Dish
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {weekDates.map((date, index) => {
              const dish = weeklyDishes[index] || null;
              
              return (
                <Card key={index} className="overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-terracotta-100 px-6 py-4 md:w-48 flex flex-col justify-center items-center md:items-start">
                      <div className="text-sm font-medium text-terracotta-500">
                        {format(date, "EEEE")}
                      </div>
                      <div className="text-2xl font-serif mt-1">
                        {format(date, "MMMM d")}
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4">
                      {dish ? (
                        <div className="relative">
                          <DishCard 
                            dish={dish} 
                            showActions={false} 
                            compact 
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50"
                            onClick={() => refreshDayDish(index)}
                            disabled={refreshingDayIndex === index}
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshingDayIndex === index ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center p-6 text-center text-muted-foreground">
                          <div>
                            <p className="mb-3">No dish planned for this day</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refreshDayDish(index)}
                              className="border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50"
                              disabled={refreshingDayIndex === index}
                            >
                              {refreshingDayIndex === index ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Shuffle className="mr-2 h-4 w-4" />
                                  Generate Suggestion
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        
        <div className="mt-8 text-center animate-fade-in delay-200">
          <p className="text-sm text-muted-foreground mb-4">
            This weekly menu is intelligently generated based on your meal history, 
            frequency of cooking, and variety of cuisines. It prioritizes dishes you enjoy
            but haven't made recently.
          </p>
          <Button 
            onClick={generateWeeklyMenu} 
            className="bg-terracotta-500 hover:bg-terracotta-600"
            disabled={isLoading || !allDishes || allDishes.length === 0 || isGenerating}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate New Suggestions'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default WeeklyMenu;
