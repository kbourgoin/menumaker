import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTagQueries, useTagMutations } from "@/hooks/tag";
import { TagBadge } from "./TagBadge";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagSelector = ({
  selectedTags,
  onTagsChange,
  placeholder = "Select tags...",
  className,
}: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { useAllTags } = useTagQueries();
  const { createTag } = useTagMutations();
  
  const { data: availableTags = [], isLoading } = useAllTags();

  const handleTagSelect = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    onTagsChange(selectedTags.filter(t => t !== tagName));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      await createTag.mutateAsync({
        name: newTagName.trim(),
      });
      
      // Add the new tag to selected tags
      onTagsChange([...selectedTags, newTagName.trim()]);
      setNewTagName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const unselectedTags = availableTags.filter(tag => !selectedTags.includes(tag.name));

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Tags</Label>
      
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              removable
              onRemove={() => handleRemoveTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Tag Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <Plus className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2">
                  <p className="text-sm text-muted-foreground mb-2">No tags found.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create new tag
                  </Button>
                </div>
              </CommandEmpty>
              
              {/* Create New Tag Section */}
              {(isCreating || unselectedTags.length === 0) && (
                <div className="p-2 border-b">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New tag name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateTag();
                        }
                        if (e.key === "Escape") {
                          setIsCreating(false);
                          setNewTagName("");
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim() || createTag.isPending}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Tags */}
              {unselectedTags.length > 0 && (
                <CommandGroup>
                  {unselectedTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        handleTagSelect(tag.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTags.includes(tag.name) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};