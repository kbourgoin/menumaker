import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useDishes } from "@/hooks/useMeals";
import DishForm from "@/components/dish-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Dish, MealHistory } from "@/types";
import {
  LoadingState,
  ErrorState,
  NotFoundState,
  DishDetailsCard,
  CookingHistoryTab,
} from "@/components/meal-detail";

const MealDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDish, getMealHistoryForDish, deleteDish } = useDishes();
  const { toast } = useToast();
  const [dish, setDish] = useState<Dish | null>(null);
  const [history, setHistory] = useState<MealHistory[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyLastUpdated, setHistoryLastUpdated] = useState(Date.now());

  const fetchHistory = useCallback(async () => {
    if (!id) return;

    try {
      const historyData = await getMealHistoryForDish(id);
      setHistory(historyData);
    } catch (historyError) {
      console.error("Error fetching meal history:", historyError);
      setHistory([]);
    }
  }, [id, getMealHistoryForDish]);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError("No dish ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const dishData = await getDish(id);

      if (!dishData) {
        setDish(null);
        setError("Dish not found");
        setIsLoading(false);
        return;
      }

      setDish(dishData);

      // Only fetch history if we're on the history tab
      if (activeTab === "history") {
        await fetchHistory();
      }
    } catch (fetchError) {
      console.error("Error fetching dish:", fetchError);
      setError("Failed to load dish details. Please try again later.");

      toast({
        title: "Error loading dish",
        description: "There was a problem loading this dish's details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, getDish, activeTab, fetchHistory, toast]);

  // Initial data fetch only
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Only fetch history when needed
  useEffect(() => {
    if (activeTab === "history" || historyLastUpdated) {
      fetchHistory();
    }
  }, [activeTab, historyLastUpdated, fetchHistory]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleHistoryUpdated = () => {
    setHistoryLastUpdated(Date.now());
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDish(id);
      toast({
        title: "Dish deleted",
        description: `${dish?.name || "Dish"} has been deleted.`,
      });
      navigate("/all-meals");
    } catch (err) {
      console.error("Error deleting dish:", err);
      toast({
        title: "Error",
        description: "Failed to delete the dish. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onBack={handleBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  if (!dish) {
    return <NotFoundState onBack={handleBack} />;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-slide-down">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {dish.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this dish and all its cooking history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <DishDetailsCard dish={dish} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Edit Dish</TabsTrigger>
            <TabsTrigger value="history">Cooking History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <Card className="p-6">
              <DishForm
                existingDish={dish}
                onSuccess={() => {
                  toast({
                    title: "Dish updated",
                    description: "The dish has been updated successfully.",
                  });
                  navigate("/all-meals");
                }}
              />
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <CookingHistoryTab
              history={history}
              dishId={dish.id}
              dishName={dish.name}
              onHistoryUpdated={handleHistoryUpdated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MealDetail;
