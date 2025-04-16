
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useDishes } from "@/hooks/useMeals";
import DishForm from "@/components/dish-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Dish, MealHistory } from "@/types";
import { 
  LoadingState, 
  ErrorState, 
  NotFoundState, 
  DishDetailsCard,
  CookingHistoryTab
} from "@/components/meal-detail";

const MealDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDish, getMealHistoryForDish } = useDishes();
  const { toast } = useToast();
  const [dish, setDish] = useState<Dish | null>(null);
  const [history, setHistory] = useState<MealHistory[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!id) {
      setError("No dish ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching dish with ID:", id);
      
      const dishData = await getDish(id);
      
      if (!dishData) {
        console.log("No dish found for ID:", id);
        setDish(null);
        setError("Dish not found");
        setIsLoading(false);
        return;
      }
      
      console.log("Dish loaded successfully:", dishData);
      setDish(dishData);
      
      try {
        // Get meal history and ensure it has the correct shape
        const historyData = await getMealHistoryForDish(id);
        
        if (Array.isArray(historyData)) {
          // Explicitly verify we have all required fields
          const validHistoryData = historyData.map(item => {
            if (!item.id || !item.dishId || !item.user_id) {
              console.error("Invalid history item:", item);
              return null;
            }
            return item;
          }).filter((item): item is MealHistory => item !== null);
          
          setHistory(validHistoryData);
        } else {
          console.error("History data is not an array:", historyData);
          setHistory([]);
        }
      } catch (historyError) {
        console.error("Error fetching meal history:", historyError);
        setHistory([]);
        // Don't fail the whole page for history errors
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
  };

  // Refresh data when tab changes or after edits
  useEffect(() => {
    fetchData();
  }, [id, activeTab]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
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
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
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
                  // Navigate directly rather than refreshing
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MealDetail;
