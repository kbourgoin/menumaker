
import { useState } from "react";
import { useDataImport } from "@/hooks/import";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JSONExport() {
  const { exportAllData, downloadExportFile, isExporting } = useDataImport();
  const { toast } = useToast();
  const [exportCount, setExportCount] = useState<Record<string, number>>({});

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      
      // Set counts for display
      setExportCount({
        dishes: data.dishes.length,
        meals: data.mealHistory.length,
        sources: data.sources.length
      });
      
      // Download the file
      downloadExportFile(data);
      
      toast({
        title: "Export successful",
        description: `Successfully exported ${data.dishes.length} dishes, ${data.mealHistory.length} meal entries, and ${data.sources.length} sources.`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Export Data as JSON</h3>
              <p className="text-sm text-muted-foreground">
                Download all your meal data as a JSON file for backup or transfer
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
          
          {Object.keys(exportCount).length > 0 && (
            <div className="text-sm">
              <p>Last export included:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>{exportCount.dishes} dishes</li>
                <li>{exportCount.meals} meal entries</li>
                <li>{exportCount.sources} sources</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
