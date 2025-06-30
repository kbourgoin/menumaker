
import { useState, useRef } from "react";
import { useJSONImport } from "@/hooks/import-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportData } from "@/hooks/import-export/useDataExport";

export function JSONImport() {
  const { importFromJSON, validateJSONData, isImporting, progress: importProgress } = useJSONImport();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStats, setImportStats] = useState<{ success: number; errors: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError("Please select a JSON file");
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      setImportStats(null);
      
      // Read the file
      const text = await selectedFile.text();
      let data: unknown;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        setError("Invalid JSON file format");
        return;
      }
      
      // Validate the JSON structure
      const validationResult = validateJSONData(data);
      if (!validationResult.valid) {
        setError(validationResult.message || "Invalid data format");
        return;
      }
      
      // Import the data
      const result = await importFromJSON(data as ExportData, (processed, total) => {
        console.log(`Import progress: ${processed}/${total}`);
      });
      
      setImportStats(result);
      
      // Reset file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Import complete",
        description: `Successfully imported ${result.success} items. ${result.errors > 0 ? `${result.errors} items failed.` : ''}`,
        variant: result.errors > 0 ? "default" : "default",
      });
    } catch (error) {
      console.error("Import failed:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="cursor-pointer flex-1"
          disabled={isImporting}
        />
        
        <Button
          onClick={handleImport}
          disabled={!selectedFile || isImporting}
          className="gap-2 whitespace-nowrap"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Importing...</span>
            <span>{importProgress}%</span>
          </div>
          <Progress value={importProgress} className="h-2" />
        </div>
      )}
      
      {importStats && (
        <Alert>
          <AlertDescription>
            Import complete: {importStats.success} items imported successfully
            {importStats.errors > 0 ? `, ${importStats.errors} errors occurred` : ''} 
            {' '}out of {importStats.total} total items.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
