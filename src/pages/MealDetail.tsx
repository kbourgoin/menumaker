
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import Layout from "@/components/Layout";
import { useDishes } from "@/hooks/useMeals";
import DishForm from "@/components/MealForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, MessageSquare } from "lucide-react";
import CuisineTag from "@/components/CuisineTag";
import SourceLink from "@/components/SourceLink";
import { useToast } from "@/hooks/use-toast";
import { Dish } from "@/types";

const MealDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDish, getMealHistoryForDish } = useDishes();
  const { toast } = useToast();
  const [dish, setDish] = useState<Dish | null>(null);
  const [history, setHistory] = useState<{date: string; notes?: string}[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          setIsLoading(true);
          const dishData = await getDish(id);
          setDish(dishData);
          
          const historyData = await getMealHistoryForDish(id);
          setHistory(historyData);
        } catch (error) {
          console.error("Error fetching dish:", error);
          toast({
            title: "Dish not found",
            description: "The dish you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate("/all-meals");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
  }, [id, getDish, getMealHistoryForDish, navigate, toast]);

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (e) {
      console.error("Error parsing date", e);
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto animate-pulse p-8">
          <div className="h-6 bg-gray-200 rounded mb-4 w-24"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    );
  }

  if (!dish) {
    return null;
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
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">{dish.name}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {dish.cuisines.map(cuisine => (
                <CuisineTag key={cuisine} cuisine={cuisine} />
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              <div className="mb-2">Cooked {dish.timesCooked} {dish.timesCooked === 1 ? "time" : "times"}</div>
              {dish.source && dish.source.type !== 'none' && (
                <div className="mt-2">
                  <SourceLink source={dish.source} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Edit Dish</TabsTrigger>
            <TabsTrigger value="history">Cooking History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-0">
            <Card className="p-6">
              <DishForm 
                existingDish={dish} 
                onSuccess={async () => {
                  toast({
                    title: "Dish updated",
                    description: "The dish has been updated successfully.",
                  });
                  // Refresh data
                  if (id) {
                    try {
                      const updatedDish = await getDish(id);
                      setDish(updatedDish);
                    } catch (error) {
                      console.error("Error refreshing dish data:", error);
                    }
                  }
                }} 
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Cooking History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatDate(entry.date)}
                        </div>
                        {entry.notes && (
                          <div className="mt-2 flex items-start">
                            <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                            <div className="text-sm">{entry.notes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No cooking history recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MealDetail;
