
import { Separator } from "@/components/ui/separator";
import { JSONExport } from "./JSONExport";
import { JSONImport } from "./JSONImport";
import CSVImportLegacy from "./CSVImportLegacy";
import { ClearDataDialog } from "@/components/ClearDataDialog";

export function DataManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Backup & Restore</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Export your data for backup or transfer between accounts
        </p>
        <div className="grid gap-4">
          <JSONExport />
          <JSONImport />
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium mb-2">Legacy Import</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Import your meal history from a CSV file (older format)
        </p>
        <CSVImportLegacy />
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium mb-2">Reset Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Clear all your meal data from the app
        </p>
        <ClearDataDialog />
      </div>
    </div>
  );
}
