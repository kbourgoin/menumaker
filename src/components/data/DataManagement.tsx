import { JSONExport } from "./JSONExport";
import { JSONImport } from "./JSONImport";
import { ClearDataDialog } from "@/components/dialogs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function DataManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Export your data for backup or transfer between accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-950">
            <h3 className="text-lg font-medium">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download all your meal data as a JSON file for backup or transfer
            </p>
            <JSONExport />
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-950">
            <h3 className="text-lg font-medium">Import Data</h3>
            <p className="text-sm text-muted-foreground">
              Restore data from a previously exported JSON file
            </p>
            <JSONImport />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Data</CardTitle>
          <CardDescription>
            Clear all your meal data from the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClearDataDialog />
        </CardContent>
      </Card>
    </div>
  );
}
