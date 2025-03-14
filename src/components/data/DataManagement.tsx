
import { Separator } from "@/components/ui/separator";
import { JSONExport } from "./JSONExport";
import { JSONImport } from "./JSONImport";
import CSVImportLegacy from "./CSVImportLegacy";
import { ClearDataDialog } from "@/components/ClearDataDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
        <CardContent className="grid gap-6">
          <JSONExport />
          <Separator />
          <JSONImport />
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-2">Legacy Import</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import your meal history from a CSV file (older format)
            </p>
            <CSVImportLegacy />
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
