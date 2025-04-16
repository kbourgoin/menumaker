
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./FormSchema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Book, Globe } from "lucide-react";
import { Source } from "@/types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SourceSelectorProps {
  form: UseFormReturn<FormValues>;
  sources: Source[];
}

const SourceSelector = ({ form, sources }: SourceSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <Book className="h-4 w-4 mr-2" />;
      case 'website':
        return <Globe className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  // Filter sources based on search value
  const filteredSources = sources.filter(source => 
    source.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Hide location field when no source is selected
  useEffect(() => {
    const sourceId = form.getValues("sourceId");
    if (!sourceId) {
      form.setValue("location", "");
    }
  }, [form.watch("sourceId")]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="sourceId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Recipe Source</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      <div className="flex items-center">
                        {getSourceIcon(sources.find(source => source.id === field.value)?.type || '')}
                        <span>{sources.find(source => source.id === field.value)?.name}</span>
                      </div>
                    ) : (
                      "No source selected"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[300px]" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search sources..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>No source found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          form.setValue("sourceId", "");
                          form.setValue("location", "");
                          setOpen(false);
                          setSearchValue("");
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            !field.value ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        No source
                      </CommandItem>
                      {filteredSources.map((source) => (
                        <CommandItem
                          key={source.id}
                          value={source.id}
                          onSelect={() => {
                            form.setValue("sourceId", source.id);
                            setOpen(false);
                            setSearchValue("");
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              field.value === source.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center">
                            {getSourceIcon(source.type)}
                            <span>{source.name}</span>
                          </div>
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
