
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSourceDialog } from "@/components/dialogs";

const SourceEmptyState = () => {
  return (
    <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
      <div className="bg-muted rounded-full p-3">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No sources yet</h3>
      <p className="text-muted-foreground max-w-md">
        Add books, websites, or documents that you use for your recipes
      </p>
      <AddSourceDialog className="mt-2" />
    </div>
  );
};

export default SourceEmptyState;
