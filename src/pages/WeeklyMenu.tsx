import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Lightbulb, Shuffle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWeeklyMenu } from "@/hooks/useWeeklyMenu";
import { SuggestionCategory } from "@/components/suggestions";
import { PlanMealDialog } from "@/components/dialogs";
import { Dish } from "@/types";

const WeeklyMenu = () => {
  const {
    allDishes,
    isLoading,
    categories,
    hasCategories,
    generateSuggestions,
    shuffleCategory,
  } = useWeeklyMenu();
  const { toast } = useToast();
  const [shufflingCategory, setShufflingCategory] = useState<string | null>(
    null
  );
  const [planningDish, setPlanningDish] = useState<Dish | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  // Generate suggestions when dishes are loaded
  useEffect(() => {
    if (!isLoading && allDishes && allDishes.length > 0 && !hasCategories) {
      generateSuggestions();
    }
  }, [isLoading, allDishes, hasCategories, generateSuggestions]);

  const handleShuffle = async (categoryId: string) => {
    setShufflingCategory(categoryId);
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    shuffleCategory(categoryId);
    setShufflingCategory(null);
  };

  const handleRegenerateAll = () => {
    generateSuggestions();
    toast({
      title: "Suggestions refreshed",
      description: "New dish ideas based on your cooking history.",
    });
  };

  const handlePlanMeal = (dish: Dish) => {
    setPlanningDish(dish);
    setPlanDialogOpen(true);
  };

  const handlePlanSuccess = () => {
    toast({
      title: "Meal planned!",
      description: "Check your dashboard to see upcoming meals.",
    });
  };

  // Count total suggestions across all categories
  const totalSuggestions = categories.reduce(
    (sum, cat) => sum + cat.dishes.length,
    0
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 animate-slide-down">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">
              What to Cook
            </h1>
            <p className="text-muted-foreground">
              Personalized suggestions based on your cooking history
            </p>
          </div>

          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={handleRegenerateAll}
              className="border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50"
              disabled={isLoading || !allDishes || allDishes.length === 0}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 text-center animate-fade-in">
            <div className="animate-pulse text-lg">Loading your dishes...</div>
          </div>
        )}

        {/* Empty state - no dishes */}
        {!isLoading && (!allDishes || allDishes.length === 0) && (
          <div className="py-12 text-center text-muted-foreground animate-fade-in">
            <Lightbulb className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium mb-1">
              No dishes in your collection yet
            </h3>
            <p>Add some dishes to get personalized meal suggestions.</p>
            <Link to="/add-meal" className="mt-4 inline-block">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600 mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Dish
              </Button>
            </Link>
          </div>
        )}

        {/* Empty state - dishes exist but no suggestions */}
        {!isLoading &&
          allDishes &&
          allDishes.length > 0 &&
          totalSuggestions === 0 &&
          hasCategories && (
            <div className="py-12 text-center text-muted-foreground animate-fade-in">
              <Lightbulb className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-1">
                Keep cooking to unlock suggestions!
              </h3>
              <p className="mb-4">
                As you cook more dishes and build history, personalized
                suggestions will appear here.
              </p>
              <Link to="/dishes">
                <Button
                  variant="outline"
                  className="border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50"
                >
                  Browse Your Dishes
                </Button>
              </Link>
            </div>
          )}

        {/* Category sections */}
        {!isLoading && hasCategories && totalSuggestions > 0 && (
          <div className="space-y-6 animate-fade-in">
            {categories.map(category => (
              <SuggestionCategory
                key={category.id}
                id={category.id}
                title={category.title}
                description={category.description}
                dishes={category.dishes}
                emptyMessage={category.emptyMessage}
                onShuffle={handleShuffle}
                onPlanMeal={handlePlanMeal}
                isShuffling={shufflingCategory === category.id}
              />
            ))}
          </div>
        )}

        {/* Footer hint */}
        {!isLoading && hasCategories && totalSuggestions > 0 && (
          <div className="mt-8 text-center animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Click <strong>Plan</strong> on any dish to schedule it for your
              week.
              <br />
              Use <strong>Shuffle</strong> to see different suggestions in each
              category.
            </p>
          </div>
        )}
      </div>

      {/* Plan Meal Dialog */}
      <PlanMealDialog
        dish={planningDish}
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        onSuccess={handlePlanSuccess}
      />
    </Layout>
  );
};

export default WeeklyMenu;
