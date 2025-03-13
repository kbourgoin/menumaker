
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
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
  );
};

export default CuisineSelector;
