
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface ViewToggleProps {
  viewMode: "cards" | "table";
  setViewMode: (mode: "cards" | "table") => void;
}

const ViewToggle = ({ viewMode, setViewMode }: ViewToggleProps) => {
  return (
    <div className="flex justify-end mb-4">
      <div 
        className="bg-muted rounded-md p-1" 
        role="group" 
        aria-label="View mode selection"
      >
        <Toggle
          pressed={viewMode === "cards"}
          onPressedChange={() => setViewMode("cards")}
          aria-label="Switch to cards view"
          aria-describedby="view-toggle-description"
          className="data-[state=on]:bg-white data-[state=on]:text-foreground"
        >
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Cards view</span>
        </Toggle>
        <Toggle
          pressed={viewMode === "table"}
          onPressedChange={() => setViewMode("table")}
          aria-label="Switch to table view"
          aria-describedby="view-toggle-description"
          className="data-[state=on]:bg-white data-[state=on]:text-foreground"
        >
          <TableIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Table view</span>
        </Toggle>
        <div id="view-toggle-description" className="sr-only">
          Choose how to display your dishes: cards or table format
        </div>
      </div>
    </div>
  );
};

export default ViewToggle;
