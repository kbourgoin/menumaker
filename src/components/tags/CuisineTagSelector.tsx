import { useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useTagQueries, useTagMutations } from "@/hooks/tags";
import { Input } from "@/components/ui/input";
import { CuisineTag } from "@/components/shared";

interface CuisineTagSelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  fieldName?: string;
}

// Color mapping for cuisine tags (same as CuisineTag component)
const cuisineColors: Record<string, string> = {
  Italian: "bg-red-50 text-red-700 border-red-200",
  Mexican: "bg-green-50 text-green-700 border-green-200",
  American: "bg-blue-50 text-blue-700 border-blue-200",
  Asian: "bg-purple-50 text-purple-700 border-purple-200",
  Mediterranean: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Indian: "bg-orange-50 text-orange-700 border-orange-200",
  French: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Greek: "bg-sky-50 text-sky-700 border-sky-200",
  Thai: "bg-lime-50 text-lime-700 border-lime-200",
  Japanese: "bg-pink-50 text-pink-700 border-pink-200",
  Chinese: "bg-red-50 text-red-700 border-red-200",
  Korean: "bg-violet-50 text-violet-700 border-violet-200",
  "Middle Eastern": "bg-amber-50 text-amber-700 border-amber-200",
  Vietnamese: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Spanish: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Caribbean: "bg-teal-50 text-teal-700 border-teal-200",
  German: "bg-gray-50 text-gray-700 border-gray-200",
  British: "bg-slate-50 text-slate-700 border-slate-200",
  Fusion: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  Other: "bg-stone-50 text-stone-700 border-stone-200",
};

const CuisineTagSelector = ({
  form,
  fieldName = "cuisines",
}: CuisineTagSelectorProps) => {
  const { useCuisineTags } = useTagQueries();
  const { createTag } = useTagMutations();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCuisineName, setNewCuisineName] = useState("");

  const { data: cuisineTags = [], isLoading } = useCuisineTags();

  // Sort cuisines alphabetically, but keep "Other" at the end
  const sortedCuisines = [...cuisineTags].sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return a.name.localeCompare(b.name);
  });

  const handleCreateCuisine = async () => {
    if (!newCuisineName.trim()) return;

    try {
      await createTag.mutateAsync({
        name: newCuisineName.trim(),
        category: "cuisine",
        color:
          cuisineColors[newCuisineName.trim()] ||
          "bg-gray-100 text-gray-800 border-gray-200",
      });

      // Set the new cuisine as selected
      form.setValue(fieldName, [newCuisineName.trim()]);
      setNewCuisineName("");
      setIsCreating(false);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create cuisine:", error);
    }
  };

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Cuisine</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between"
                >
                  {field.value?.[0] ? (
                    <CuisineTag cuisine={field.value[0]} size="sm" />
                  ) : (
                    "Select a cuisine"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search cuisine..." />
                <CommandEmpty>
                  <div className="p-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      No cuisine found.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreating(true)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create new cuisine
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandList>
                  {/* Create New Cuisine Section */}
                  {isCreating && (
                    <div className="p-2 border-b">
                      <div className="flex gap-2">
                        <Input
                          placeholder="New cuisine name..."
                          value={newCuisineName}
                          onChange={e => setNewCuisineName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateCuisine();
                            }
                            if (e.key === "Escape") {
                              setIsCreating(false);
                              setNewCuisineName("");
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateCuisine}
                          disabled={
                            !newCuisineName.trim() || createTag.isPending
                          }
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  <CommandGroup>
                    {isLoading ? (
                      <CommandItem disabled>Loading cuisines...</CommandItem>
                    ) : (
                      sortedCuisines.map(cuisineTag => (
                        <CommandItem
                          key={cuisineTag.id}
                          value={cuisineTag.name}
                          onSelect={() => {
                            form.setValue(fieldName, [cuisineTag.name]);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.[0] === cuisineTag.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <CuisineTag cuisine={cuisineTag.name} size="sm" />
                        </CommandItem>
                      ))
                    )}
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

export default CuisineTagSelector;
