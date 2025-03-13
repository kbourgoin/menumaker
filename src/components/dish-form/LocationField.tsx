
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./FormSchema";

interface LocationFieldProps {
  form: UseFormReturn<FormValues>;
}

const LocationField = ({ form }: LocationFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Location</FormLabel>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <FormControl>
              <Input 
                {...field} 
                placeholder="Where is this dish from? (e.g., 'Mom's kitchen', 'Italy trip 2023')" 
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
