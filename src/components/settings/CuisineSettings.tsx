import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserCuisines } from "@/hooks/useUserCuisines";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, RotateCcw, X } from "lucide-react";
import { CuisineType } from "@/types";

const CuisineSettings = () => {
  const { cuisines, isLoading, addCuisine, removeCuisine, resetToDefaults } =
    useUserCuisines();
  const [newCuisine, setNewCuisine] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleAddCuisine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCuisine.trim()) return;

    setIsAdding(true);
    try {
      const success = await addCuisine(newCuisine);
      if (success) {
        setNewCuisine("");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleResetCuisines = async () => {
    setIsResetting(true);
    try {
      await resetToDefaults();
    } finally {
      setIsResetting(false);
    }
  };

  const handleRemoveCuisine = async (cuisine: CuisineType) => {
    await removeCuisine(cuisine);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Cuisines</h3>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset to Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Cuisines</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset your cuisines list to the default values. Any
                custom cuisines you've added will be removed. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetCuisines}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Cuisines"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Customize the list of cuisines available in your dish forms
      </p>

      <form onSubmit={handleAddCuisine} className="flex gap-2">
        <Input
          value={newCuisine}
          onChange={e => setNewCuisine(e.target.value)}
          placeholder="Add new cuisine..."
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newCuisine.trim() || isAdding}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </>
          )}
        </Button>
      </form>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Available Cuisines</h4>

        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cuisines.map(cuisine => (
              <Badge
                key={cuisine}
                variant="outline"
                className="pl-2 pr-1 py-1 flex items-center gap-1"
              >
                {cuisine}
                {cuisine !== "Other" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full hover:bg-muted"
                    onClick={() => handleRemoveCuisine(cuisine)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {cuisine}</span>
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CuisineSettings;
