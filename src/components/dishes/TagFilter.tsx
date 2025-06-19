import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTagQueries } from "@/hooks/tag";
import { TagBadge } from "@/components/tags";

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export const TagFilter = ({
  selectedTags,
  onTagsChange,
  className,
}: TagFilterProps) => {
  const [open, setOpen] = useState(false);

  const { useGeneralTags } = useTagQueries();
  const { data: availableTags = [], isLoading } = useGeneralTags();

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  if (isLoading || availableTags.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              variant="default"
              removable
              onRemove={() => handleTagToggle(tag)}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Tag Filter Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter by tags
            {selectedTags.length > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {selectedTags.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => {
                      handleTagToggle(tag.name);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.includes(tag.name) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tag.name}
                    {tag.description && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {tag.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};