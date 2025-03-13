
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { UseFormReturn, useWatch } from "react-hook-form";
import { FormValues } from "./FormSchema";
import { LinkIcon, Book } from "lucide-react";
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
  const sourceType = useWatch({ control: form.control, name: "sourceType" });
  const [showSourceFields, setShowSourceFields] = useState(sourceType !== "none");

  useEffect(() => {
    setShowSourceFields(sourceType !== "none");
  }, [sourceType]);

  const renderSourceSelectionFields = () => {
    if (!showSourceFields) {
      return null;
    }

    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="sourceValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {sourceType === "url" ? "URL" : "Book Title/Notes"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={
                    sourceType === "url"
                      ? "https://example.com/recipe"
                      : "Notes about the source"
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {sourceType === "book" && (
          <>
            <FormField
              control={form.control}
              name="sourceId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Select Source</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="justify-between"
                        >
                          {field.value && sources.length > 0
                            ? sources.find(
                                (source) => source.id === field.value
                              )?.name || "Select source"
                            : "Select source"}
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
                            {sources
                              .filter(source => source.type === 'book')
                              .map((source) => (
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
                                  {source.name}
                                </CommandItem>
                              ))
                            }
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </>
        )}
      </div>
    );
  };

  return (
    <>
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
                    Book
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {renderSourceSelectionFields()}
    </>
  );
};

export default SourceSelector;
