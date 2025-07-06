
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Edit, Plus, Shuffle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddCookedDishDialog } from "@/components/dialogs";

const QuickActions = () => {
  return (
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
  );
};

export default QuickActions;
