import { Book } from "lucide-react";

const CookbookEmptyState = () => {
  return (
    <div className="text-center p-6 border rounded-lg">
      <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <p className="text-muted-foreground">
        No cookbooks added yet. Add your first cookbook to get started.
      </p>
    </div>
  );
};

export default CookbookEmptyState;
