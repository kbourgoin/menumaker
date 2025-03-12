
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useMeals } from "@/hooks/useMeals";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { Calendar, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MealCard from "@/components/MealCard";
import { Link } from "react-router-dom";
import CuisineTag from "@/components/CuisineTag";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const Index = () => {
  const { meals, isLoading, getStats, getWeeklyMealSuggestions } = useMeals();
  const [stats, setStats] = useState<any>(null);
  const [weeklyMeals, setWeeklyMeals] = useState<any[]>([]);
  
  useEffect(() => {
    if (!isLoading) {
      setStats(getStats());
      setWeeklyMeals(getWeeklyMealSuggestions(4));
    }
  }, [isLoading, meals]);

  const formatDateRange = () => {
    const startDate = startOfWeek(new Date());
    const endDate = endOfWeek(new Date());
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  const getTopCuisines = () => {
    if (!stats?.cuisineBreakdown) return [];
    
    const sortedCuisines = Object.entries(stats.cuisineBreakdown)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([cuisine, count]) => ({
        name: cuisine,
        value: count,
      }));
    
    return sortedCuisines;
  };
  
  const COLORS = [
    '#B85C43', 
    '#7B9170', 
    '#FFD08A', 
    '#D49F92', 
    '#B3C2AB'
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-lg">Loading your meal data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center animate-slide-down">
          <h1 className="text-4xl font-serif font-medium mb-2">Family Meal Memories</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track, discover and reminisce about your family's favorite meals throughout the years.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Quick Stats Card */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-terracotta-100 to-terracotta-50 pb-4">
              <CardTitle className="text-terracotta-500 flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Your Meal Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-cream-50 rounded-lg">
                  <div className="text-3xl font-medium text-terracotta-500">
                    {stats?.totalMeals || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Unique Meals</div>
                </div>
                <div className="text-center p-4 bg-cream-50 rounded-lg">
                  <div className="text-3xl font-medium text-terracotta-500">
                    {stats?.totalTimesCooked || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Times Cooked</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Top Cuisines</h4>
                <div className="flex flex-wrap gap-2">
                  {getTopCuisines().slice(0, 3).map((cuisine: any) => (
                    <div key={cuisine.name} className="flex items-center">
                      <CuisineTag cuisine={cuisine.name} size="sm" />
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({cuisine.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Link to="/all-meals">
                  <Button variant="outline" className="w-full">
                    View All Meals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Weekly Meal Suggestions Card */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 animate-fade-in delay-100">
            <CardHeader className="bg-gradient-to-r from-sage-100 to-sage-50 pb-4">
              <CardTitle className="text-sage-500 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Meal Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-4">
                Here are some meal ideas for this week:
              </div>
              
              <ul className="space-y-3">
                {weeklyMeals.slice(0, 4).map((meal) => (
                  <li key={meal.id} className="p-3 bg-cream-50 rounded-lg flex justify-between items-center group">
                    <div>
                      <div className="font-medium">{meal.name}</div>
                      {meal.cuisines[0] && (
                        <CuisineTag cuisine={meal.cuisines[0]} size="sm" />
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-terracotta-500"
                      asChild
                    >
                      <Link to="/add-meal">
                        <Plus className="h-4 w-4 mr-1" />
                        Cook
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 flex justify-center">
                <Link to="/weekly-menu">
                  <Button variant="outline" className="w-full">
                    See Weekly Plan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Insights Card */}
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 animate-fade-in delay-200">
            <CardHeader className="bg-gradient-to-r from-cream-100 to-cream-50 pb-4">
              <CardTitle className="text-terracotta-500 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Cuisine Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {stats && getTopCuisines().length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getTopCuisines()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {getTopCuisines().map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [`${value} meals`, name]}
                        contentStyle={{ background: "rgba(255, 255, 255, 0.9)", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  Add more meals to see cuisine insights
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Most Cooked Meal</h4>
                {stats?.mostCooked ? (
                  <div className="p-3 bg-cream-50 rounded-lg">
                    <div className="font-medium">{stats.mostCooked.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Cooked {stats.mostCooked.timesCooked} times
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No meals cooked yet
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-center">
                <Link to="/add-meal">
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-1 h-4 w-4" />
                    Add New Meal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8">
          <Tabs defaultValue="recent" className="animate-fade-in delay-300">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="recent">Recent Meals</TabsTrigger>
                <TabsTrigger value="popular">Popular Meals</TabsTrigger>
              </TabsList>
              
              <Link to="/add-meal">
                <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meal
                </Button>
              </Link>
            </div>
            
            <TabsContent value="recent" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stats?.recentlyCooked?.length > 0 ? (
                  stats.recentlyCooked
                    .filter((item: any) => item.meal)
                    .map((item: any) => (
                      <MealCard 
                        key={`${item.meal.id}-${item.date}`} 
                        meal={item.meal} 
                        compact
                      />
                    ))
                ) : (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-medium mb-1">No meals recorded yet</h3>
                    <p>Start tracking your family meals by adding your first meal.</p>
                    <Link to="/add-meal" className="mt-4 inline-block">
                      <Button className="bg-terracotta-500 hover:bg-terracotta-600 mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Meal
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="popular" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {meals.length > 0 ? (
                  [...meals]
                    .sort((a, b) => b.timesCooked - a.timesCooked)
                    .slice(0, 8)
                    .map((meal) => (
                      <MealCard 
                        key={meal.id} 
                        meal={meal} 
                        compact
                      />
                    ))
                ) : (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-medium mb-1">No meals added yet</h3>
                    <p>Start your collection by adding your favorite family meals.</p>
                    <Link to="/add-meal" className="mt-4 inline-block">
                      <Button className="bg-terracotta-500 hover:bg-terracotta-600 mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Meal
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
