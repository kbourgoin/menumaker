
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CUISINES } from "./constants";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./FormSchema";

interface CuisineSelectorProps {
  form: UseFormReturn<FormValues>;
}

const CuisineSelector = ({ form }: CuisineSelectorProps) => {
  return (
    <FormField
      control={form.control}
      name="cuisines"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cuisine</FormLabel>
          <Select
            onValueChange={(value) => field.onChange([value])}
            defaultValue={field.value[0] || ""}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a cuisine" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CUISINES.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CuisineSelector;
