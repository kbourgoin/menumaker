import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import { Dish, Source } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { formSchema, FormValues } from "./FormSchema";
import SourceSelector from "./SourceSelector";
import LocationField from "./LocationField";
import { useSources } from "@/hooks/sources";
import { TagSelector } from "@/components/tags";
import CuisineTagSelector from "@/components/tags/CuisineTagSelector";
import { useTagMutations, useTagQueries } from "@/hooks/tags";

interface DishFormProps {
  existingDish?: Dish;
  onSuccess?: (dish: Dish) => void;
}

const DishForm = ({ existingDish, onSuccess }: DishFormProps) => {
  const { dishes: _dishes, addDish, updateDish } = useDishes();
  const { getSources } = useSources();
  const { createTag, addMultipleTagsToDish, removeTagFromDish } =
    useTagMutations();
  const { useAllTags, useTagsByDishId } = useTagQueries();
  const { data: allTags = [] } = useAllTags();
  const { data: currentTags = [] } = useTagsByDishId(existingDish?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ["sources"],
    queryFn: getSources,
    enabled: true,
  });

  // Format the existing dish cuisine as an array to match the form schema
  const defaultCuisine =
    existingDish?.cuisines && existingDish.cuisines.length > 0
      ? [existingDish.cuisines[0]]
      : ["Other"];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingDish?.name || "",
      cuisines: defaultCuisine,
      sourceId: existingDish?.sourceId || "",
      location: existingDish?.location || "",
      tags: currentTags.map(tag => tag.name) || [],
    },
  });

  // Helper function to manage tag associations
  const manageTags = async (dishId: string, selectedTagNames: string[]) => {
    const tagNameToId = new Map(allTags.map(tag => [tag.name, tag.id]));
    const selectedTagIds: string[] = [];

    // Process each selected tag
    for (const tagName of selectedTagNames) {
      if (tagNameToId.has(tagName)) {
        // Existing tag
        selectedTagIds.push(tagNameToId.get(tagName)!);
      } else {
        // Create new tag
        try {
          await createTag.mutateAsync({ name: tagName });
          // Note: We'll need to refetch tags to get the new ID, or handle this differently
          // For now, we'll skip adding it to the dish - the TagSelector handles creation
        } catch (error) {
          console.error(`Failed to create tag: ${tagName}`, error);
        }
      }
    }

    // Remove old tag associations for existing dish
    if (existingDish) {
      const currentTagIds = currentTags.map(tag => tag.id);
      const tagsToRemove = currentTagIds.filter(id => {
        const tagName = allTags.find(tag => tag.id === id)?.name;
        return tagName && !selectedTagNames.includes(tagName);
      });

      for (const tagId of tagsToRemove) {
        try {
          await removeTagFromDish.mutateAsync({ dishId, tagId });
        } catch (error) {
          console.error("Failed to remove tag:", error);
        }
      }
    }

    // Add new tag associations
    const tagsToAdd = selectedTagIds.filter(tagId => {
      return !currentTags.some(currentTag => currentTag.id === tagId);
    });

    if (tagsToAdd.length > 0) {
      try {
        await addMultipleTagsToDish.mutateAsync({ dishId, tagIds: tagsToAdd });
      } catch (error) {
        console.error("Failed to add tags:", error);
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      if (existingDish) {
        await updateDish(existingDish.id, {
          name: data.name,
          cuisines: data.cuisines,
          sourceId: data.sourceId || undefined,
          location: data.location,
        });

        // Manage tags
        await manageTags(existingDish.id, data.tags || []);

        if (onSuccess) {
          onSuccess(existingDish);
        } else {
          toast({
            title: "Dish updated",
            description: `${data.name} has been updated successfully.`,
          });
          navigate("/all-meals");
        }
      } else {
        const newDish = await addDish({
          name: data.name,
          cuisines: data.cuisines,
          sourceId: data.sourceId || undefined,
          location: data.location,
        });

        // Manage tags for new dish
        if (newDish && data.tags && data.tags.length > 0) {
          await manageTags(newDish.id, data.tags);
        }

        if (onSuccess && newDish) {
          onSuccess(newDish);
        } else {
          toast({
            title: "Dish added",
            description: `${data.name} has been added to your dishes.`,
          });
          navigate("/all-meals");
        }
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

        <CuisineTagSelector form={form} />

        <SourceSelector form={form} sources={sources} />

        <LocationField form={form} sources={sources} />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <TagSelector
                  selectedTags={field.value || []}
                  onTagsChange={field.onChange}
                  placeholder="Add tags to organize your dish"
                  category="general"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            {isSubmitting
              ? "Saving..."
              : existingDish
                ? "Update Dish"
                : "Add Dish"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DishForm;
