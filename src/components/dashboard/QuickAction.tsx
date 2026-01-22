import React from "react";
import { Link } from "react-router-dom";
import { Lightbulb, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const QuickAction = () => {
  return (
    <Card className="animate-slide-down delay-150">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Action</CardTitle>
        <CardDescription>Get inspired</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to="/weekly-menu" className="block">
          <Button
            variant="outline"
            className="w-full flex justify-between items-center text-left border-terracotta-200 hover:bg-terracotta-50 hover:border-terracotta-300 h-auto py-4"
          >
            <div className="flex items-center">
              <Lightbulb className="mr-3 h-5 w-5 text-terracotta-500" />
              <div>
                <div className="font-medium">What to Cook</div>
                <div className="text-xs text-muted-foreground">
                  Get suggestions
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default QuickAction;
