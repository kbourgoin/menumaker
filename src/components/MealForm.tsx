
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import { Dish, CuisineType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Link as LinkIcon, Book } from "lucide-react";

// List of supported cuisines
const CUISINES: CuisineType[] = [
  'Italian', 'Mexican', 'American', 'Asian', 'Mediterranean', 
  'Indian', 'French', 'Greek', 'Thai', 'Japanese', 'Chinese', 
  'Korean', 'Middle Eastern', 'Vietnamese', 'Spanish', 
  'Caribbean', 'German', 'British', 'Fusion', 'Other'
];

const formSchema = z.object({
  name: z.string().min(2, { message: "Dish name must be at least 2 characters." }),
  cuisines: z.array(z.string()).min(1, { message: "Select at least one cuisine." }),
  sourceType: z.enum(["none", "url", "book"]),
  sourceValue: z.string().optional(),
  sourcePage: z.string().optional(),
});

interface DishFormProps {
  existingDish?: Dish;
  onSuccess?: (dish: Dish) => void;
}

const DishForm = ({ existingDish, onSuccess }: DishFormProps) => {
  const { dishes, addDish, updateDish } = useDishes();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showSourceFields, setShowSourceFields] = useState(
    existingDish?.source ? (existingDish.source.type === "url" || existingDish.source.type === "book") : false
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingDish?.name || "",
      cuisines: existingDish?.cuisines || [],
      sourceType: existingDish?.source?.type || "none",
      sourceValue: existingDish?.source?.value || "",
      sourcePage: existingDish?.source?.page?.toString() || "",
    },
  });

  const watchName = form.watch("name");
  const watchSourceType = form.watch("sourceType");

  useEffect(() => {
    // Set show source fields based on source type
    setShowSourceFields(watchSourceType !== "none");
  }, [watchSourceType]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      let source = undefined;
      
      if (data.sourceType !== "none") {
        source = {
          type: data.sourceType,
          value: data.sourceValue || "",
          ...(data.sourceType === "book" && data.sourcePage ? { page: parseInt(data.sourcePage) } : {})
        };
      }
      
      if (existingDish) {
        // Update existing dish
        updateDish(existingDish.id, {
          name: data.name,
          cuisines: data.cuisines,
          source
        });
        
        toast({
          title: "Dish updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        // Add new dish
        const newDish = addDish({
          name: data.name,
          cuisines: data.cuisines,
          source
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

        <FormField
          control={form.control}
          name="cuisines"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuisines</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {CUISINES.map((cuisine) => (
                  <FormItem
                    key={cuisine}
                    className="flex items-center space-x-2 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(cuisine)}
                        onCheckedChange={(checked) => {
                          const updatedCuisines = checked
                            ? [...field.value, cuisine]
                            : field.value.filter(
                                (value) => value !== cuisine
                              );
                          field.onChange(updatedCuisines);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {cuisine}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sourceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipe Source</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="none" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      No source
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="url" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer flex items-center">
                      <LinkIcon className="mr-1 h-4 w-4" />
                      Website URL
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="book" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer flex items-center">
                      <Book className="mr-1 h-4 w-4" />
                      Cookbook
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showSourceFields && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="sourceValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchSourceType === "url" ? "URL" : "Book Title"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        watchSourceType === "url"
                          ? "https://example.com/recipe"
                          : "Cookbook title"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchSourceType === "book" && (
              <FormField
                control={form.control}
                name="sourcePage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Page number"
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

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
            className="bg-terracotta-500 hover:bg-terracotta-600"
          >
            {existingDish ? "Update Dish" : "Add Dish"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DishForm;
