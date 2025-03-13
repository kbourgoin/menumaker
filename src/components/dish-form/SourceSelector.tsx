
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./FormSchema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Source } from "@/types";

interface SourceSelectorProps {
  form: UseFormReturn<FormValues>;
  sources: Source[];
}

const SourceSelector = ({ form, sources }: SourceSelectorProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="sourceId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Recipe Source</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between"
                  >
                    {field.value
                      ? sources.find(source => source.id === field.value)?.name || "Select source"
                      : "No source selected"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search sources..." />
                  <CommandEmpty>No source found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          form.setValue("sourceId", "");
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            !field.value ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        No source
                      </CommandItem>
                      {sources.map((source) => (
                        <CommandItem
                          key={source.id}
                          value={source.id}
                          onSelect={() => {
                            form.setValue("sourceId", source.id);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              field.value === source.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {source.name} ({source.type})
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
    </div>
  );
};

export default SourceSelector;
