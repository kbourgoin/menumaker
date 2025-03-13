
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";

interface NotFoundStateProps {
  onBack: () => void;
}

const NotFoundState = ({ onBack }: NotFoundStateProps) => {
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
            <div className="text-warning text-xl mb-4">Dish Not Found</div>
            <p>The dish you're looking for doesn't exist or has been deleted.</p>
            <Button 
              onClick={onBack}
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotFoundState;
