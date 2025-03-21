
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookOpen, Globe } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./FormSchema";
import { Source } from "@/types";

interface LocationFieldProps {
  form: UseFormReturn<FormValues>;
  sources: Source[];
}

const LocationField = ({ form, sources }: LocationFieldProps) => {
  const sourceId = form.watch("sourceId");
  
  // If no source is selected, don't show the location field
  if (!sourceId) {
    return null;
  }
  
  const selectedSource = sources.find(source => source.id === sourceId);
  const sourceType = selectedSource?.type || 'book';
  
  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Source Location</FormLabel>
          <div className="flex items-center space-x-2">
            {sourceType === 'website' ? (
              <Globe className="h-4 w-4 text-muted-foreground" />
            ) : (
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            )}
            <FormControl>
              <Input 
                {...field} 
                placeholder={sourceType === 'website' 
                  ? "URL or specific section" 
                  : "Page number or specific section"} 
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default LocationField;
