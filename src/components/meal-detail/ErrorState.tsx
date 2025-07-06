
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout";

interface ErrorStateProps {
  error: string;
  onBack: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const ErrorState = ({ error, onBack, onRefresh, isRefreshing }: ErrorStateProps) => {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-8">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-6 text-center">
          <CardContent className="pt-6">
            <div className="text-destructive text-xl mb-4">Error</div>
            <p>{error}</p>
            <div className="flex justify-center mt-6 space-x-4">
              <Button 
                onClick={onRefresh}
                variant="outline"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
              <Button onClick={onBack}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ErrorState;
