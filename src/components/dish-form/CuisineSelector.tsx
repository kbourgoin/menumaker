
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
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
        <FormItem className="flex flex-col">
          <FormLabel>Cuisine</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between"
                >
                  {field.value[0] ? field.value[0] : "Select a cuisine"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search cuisine..." />
                <CommandEmpty>No cuisine found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {CUISINES.map((cuisine) => (
                      <CommandItem
                        key={cuisine}
                        value={cuisine}
                        onSelect={() => {
                          form.setValue("cuisines", [cuisine]);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            field.value[0] === cuisine
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        <span>{cuisine}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CuisineSelector;
