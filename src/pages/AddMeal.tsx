
import { Layout } from "@/components/layout";
import DishForm from "@/components/dish-form";
import { Card } from "@/components/ui/card";

const AddDish = () => {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl font-serif font-medium mb-2">Add New Dish</h1>
          <p className="text-muted-foreground">
            Create a new dish entry for your family collection
          </p>
        </div>
        
        <Card className="p-6 animate-fade-in">
          <DishForm />
        </Card>
      </div>
    </Layout>
  );
};

export default AddDish;
