
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Clock, Edit, Plus, Shuffle, Utensils } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import DishCard from "@/components/MealCard";
import { Dish } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AddCookedDishDialog from "@/components/AddCookedDishDialog";

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#F9F871', '#6A0572', '#AB83A1', '#15616D'];

const Home = () => {
  const { getWeeklyDishSuggestions, getStats } = useDishes();
  const { toast } = useToast();
  const [suggestedDishes, setSuggestedDishes] = useState<Dish[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // Use Promise.all and await to properly resolve promises
        const [suggestions, statsData] = await Promise.all([
          getWeeklyDishSuggestions(3),
          getStats()
        ]);
        
        setSuggestedDishes(suggestions);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [getWeeklyDishSuggestions, getStats]);

  const handleSuggestMoreDishes = async () => {
    try {
      setIsLoading(true);
      // Use await to properly resolve the promise
      const newSuggestions = await getWeeklyDishSuggestions(3);
      setSuggestedDishes(newSuggestions);
      
      toast({
        title: "New suggestions generated",
        description: "Here are some fresh dish ideas for you to cook."
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error generating suggestions",
        description: "There was a problem generating new suggestions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for pie chart
  const pieData = stats && stats.cuisineBreakdown
    ? Object.entries(stats.cuisineBreakdown)
        .map(([name, value]) => ({ name, value }))
        .filter(item => (item.value as number) > 0)
        .sort((a, b) => (b.value as number) - (a.value as number))
    : [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Quick actions */}
          <Card className="md:col-span-2 animate-slide-down delay-75">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Get started with these common actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/add-meal" className="w-full">
                  <Button variant="outline" className="w-full flex justify-between items-center text-left border-terracotta-200 hover:bg-terracotta-50 hover:border-terracotta-300">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4 text-terracotta-500" />
                      <span>Add New Dish</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
                
                <Link to="/weekly-menu" className="w-full">
                  <Button variant="outline" className="w-full flex justify-between items-center text-left border-terracotta-200 hover:bg-terracotta-50 hover:border-terracotta-300">
                    <div className="flex items-center">
                      <Shuffle className="mr-2 h-4 w-4 text-terracotta-500" />
                      <span>Create Weekly Menu</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
                
                <Link to="/all-meals" className="w-full">
                  <Button variant="outline" className="w-full flex justify-between items-center text-left border-terracotta-200 hover:bg-terracotta-50 hover:border-terracotta-300">
                    <div className="flex items-center">
                      <Edit className="mr-2 h-4 w-4 text-terracotta-500" />
                      <span>Edit Your Dishes</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
                
                <div className="w-full">
                  <AddCookedDishDialog />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats Card */}
          <Card className="animate-slide-down delay-100">
            <CardHeader>
              <CardTitle className="text-xl">Your Stats</CardTitle>
              <CardDescription>Summary of your cooking data</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Dishes:</span>
                    <span className="font-medium">{stats.totalDishes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Times Cooked:</span>
                    <span className="font-medium">{stats.totalTimesCooked}</span>
                  </div>
                  
                  {stats.mostCooked && (
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground">Most Cooked:</span>
                      <div className="mt-1 font-medium text-sm flex justify-between items-center">
                        <span>{stats.mostCooked.name}</span>
                        <span>{stats.mostCooked.timesCooked}x</span>
                      </div>
                    </div>
                  )}
                  
                  {pieData.length > 0 && (
                    <div className="mt-6">
                      <span className="text-sm text-muted-foreground mb-2 block">Cuisine Distribution:</span>
                      <div className="h-[150px] mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No stats available yet.</p>
                  <p className="text-sm mt-1">Add some dishes to see your stats!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Suggested Dishes */}
        <Card className="mb-6 animate-slide-down delay-150">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Suggested Dishes</CardTitle>
              <CardDescription>Try cooking one of these today</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSuggestMoreDishes}
              disabled={isLoading}
              className="border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-3 border rounded-lg p-4">
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-10 bg-slate-200 rounded w-full mt-4"></div>
                  </div>
                ))}
              </div>
            ) : suggestedDishes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestedDishes.map(dish => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Utensils className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium mb-1">No dishes available</h3>
                <p className="text-muted-foreground mb-4">Add some dishes to get suggestions</p>
                <Link to="/add-meal">
                  <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Dish
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recently Cooked */}
        <Card className="animate-slide-down delay-200">
          <CardHeader>
            <CardTitle className="text-xl">Recently Cooked</CardTitle>
            <CardDescription>Your meal history</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center border rounded-lg p-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats && stats.recentlyCooked && stats.recentlyCooked.length > 0 ? (
              <div className="space-y-3">
                {stats.recentlyCooked.map((item: any, index: number) => (
                  <div key={index} className="flex items-center border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center mr-3 text-terracotta-500">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.dish ? item.dish.name : "Unknown Dish"}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    {item.dish && (
                      <Link to={`/meal/${item.dish.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium mb-1">No cooking history yet</h3>
                <p className="text-muted-foreground mb-4">Record when you cook a dish to see your history</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Home;
