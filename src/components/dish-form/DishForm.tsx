
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import { Dish } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { formSchema, FormValues } from "./FormSchema";
import CuisineSelector from "./CuisineSelector";
import SourceSelector from "./SourceSelector";
import LocationField from "./LocationField";
import { useSources } from "@/hooks/useSources";

interface DishFormProps {
  existingDish?: Dish;
  onSuccess?: (dish: Dish) => void;
}

const DishForm = ({ existingDish, onSuccess }: DishFormProps) => {
  const { dishes, addDish, updateDish } = useDishes();
  const { getSources } = useSources();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    enabled: true,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingDish?.name || "",
      cuisines: existingDish?.cuisines || [],
      sourceType: existingDish?.sourceId ? "book" : "none",
      sourceValue: "",
      sourcePage: "",
      sourceId: existingDish?.sourceId || "",
      location: existingDish?.location || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      if (existingDish) {
        await updateDish(existingDish.id, {
          name: data.name,
          cuisines: data.cuisines,
          sourceId: data.sourceType === "book" ? data.sourceId : undefined,
          location: data.location,
        });
        
        toast({
          title: "Dish updated",
          description: `${data.name} has been updated successfully.`,
        });
        
        if (onSuccess) {
          onSuccess(existingDish);
        }
      } else {
        const newDish = await addDish({
          name: data.name,
          cuisines: data.cuisines,
          sourceId: data.sourceType === "book" ? data.sourceId : undefined,
          location: data.location,
        });
        
        toast({
          title: "Dish added",
          description: `${data.name} has been added to your dishes.`,
        });
        
        if (onSuccess && newDish) {
          onSuccess(newDish);
        }
      }
      
      if (!onSuccess) {
        navigate("/all-meals");
      }
    } catch (error) {
      console.error("Error saving dish:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your dish.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dish Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter dish name" 
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <CuisineSelector form={form} />
        
        <LocationField form={form} />
        
        <SourceSelector form={form} sources={sources} />

        <div className="flex justify-end space-x-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/all-meals")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-terracotta-500 hover:bg-terracotta-600"
          >
            {isSubmitting ? "Saving..." : existingDish ? "Update Dish" : "Add Dish"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DishForm;
