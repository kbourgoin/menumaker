import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useTagQueries, useTagMutations, type Tag } from "@/hooks/tags";
import { TagBadge } from "./TagBadge";

interface TagManagerProps {
  className?: string;
}

export const TagManager = ({ className }: TagManagerProps) => {
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { useAllTags } = useTagQueries();
  const { createTag, updateTag, deleteTag } = useTagMutations();

  const { data: tags = [], isLoading } = useAllTags();

  const handleCreateTag = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name.trim()) return;

    try {
      await createTag.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleUpdateTag = async (formData: FormData) => {
    if (!editingTag) return;

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      await updateTag.mutateAsync({
        tagId: editingTag.id,
        updates: {
          name: name.trim(),
          description: description.trim() || null,
        },
      });
      setIsEditDialogOpen(false);
      setEditingTag(null);
    } catch (error) {
      console.error("Failed to update tag:", error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag.mutateAsync(tagId);
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Tag Management</CardTitle>
          <CardDescription>Loading tags...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tag Management</CardTitle>
            <CardDescription>
              Create and manage your recipe tags
            </CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
                <DialogDescription>
                  Add a new tag to organize your recipes.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateTag}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Tag Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., freezable, quick, vegetarian"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Optional description for this tag"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTag.isPending}>
                    Create Tag
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No tags created yet. Create your first tag to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {tags.map(tag => (
              <TagRow
                key={tag.id}
                tag={tag}
                onEdit={tag => {
                  setEditingTag(tag);
                  setIsEditDialogOpen(true);
                }}
                onDelete={handleDeleteTag}
              />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription>
                Update the tag name and description.
              </DialogDescription>
            </DialogHeader>
            {editingTag && (
              <form action={handleUpdateTag}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="edit-name">Tag Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingTag.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      defaultValue={editingTag.description || ""}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingTag(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateTag.isPending}>
                    Update Tag
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

interface TagRowProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tagId: string) => void;
}

const TagRow = ({ tag, onEdit, onDelete }: TagRowProps) => {
  const { useTagUsageCount } = useTagQueries();
  const { data: usageCount = 0 } = useTagUsageCount(tag.id);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <TagBadge tag={tag.name} />
        <div className="flex-1">
          {tag.description && (
            <p className="text-sm text-muted-foreground">{tag.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Used in {usageCount} dish{usageCount !== 1 ? "es" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(tag)}>
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the tag "{tag.name}"? This will
                remove it from all dishes and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(tag.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
