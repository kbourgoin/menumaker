
import { useState } from "react";
import { processCSVFile, parseCSVLine } from "@/utils/csvUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { useDataImport } from "@/hooks/useDataImport";
import { Progress } from "@/components/ui/progress";

interface CSVImportProps {
  onImportComplete?: () => void;
}

const CSVImport = ({ onImportComplete }: CSVImportProps) => {
  const { importMealHistory } = useDataImport();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setProgress(0);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target?.result as string;
        const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '').slice(0, 5);
        // Use the improved CSV parsing for preview data as well
        setPreviewData(lines.map(line => parseCSVLine(line)));
        
        // Check if the file appears to have the right structure
        if (lines.length > 0) {
          const firstLineFields = parseCSVLine(lines[0]);
          if (firstLineFields.length < 2) {
            setError("CSV format may be incorrect. Expected at least date and dish columns.");
          }
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      console.error("Failed to read CSV for preview", error);
      setError("Failed to read the CSV file. Please check the file and try again.");
    }
  };
  
  const handleImport = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setTotalItems(1); // Initialize with 1 to show some progress immediately
    
    try {
      const entries = await processCSVFile(file);
      
      if (entries.length === 0) {
        throw new Error("No valid entries found in the CSV file. Please check the format.");
      }
      
      // Show how many entries we're going to process
      setTotalItems(Math.max(1, entries.length)); 
      
      // Use the progress callback
      const result = await importMealHistory(entries, (processed, total) => {
        setProgress(Math.floor((processed / total) * 100));
      });
      
      // Wait a moment to show 100% progress before closing dialog
      setTimeout(() => {
        setIsDialogOpen(false);
        setFile(null);
        setPreviewData([]);
        setProgress(0);
        
        toast({
          title: "Import complete",
          description: `Imported ${result.success} meals. Skipped ${result.skipped} duplicates.`,
        });
        
        if (onImportComplete) {
          onImportComplete();
        }
      }, 500);
    } catch (error) {
      console.error("Import failed:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsDialogOpen(true)}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Meal History from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with your meal history to import it into the app.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                Your CSV file should have columns for date, dish name, and notes (optional). 
                The app will extract source information if your dish name contains it in parentheses (e.g., "Mapo Tofu (RICE80)").
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-2">
              <label htmlFor="csv-file" className="text-sm font-medium">
                Select CSV File
              </label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {previewData.length > 0 && (
              <div className="border rounded p-3 text-sm space-y-1">
                <div className="font-medium mb-2">Preview:</div>
                {previewData.map((row, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    {row.map((cell, j) => (
                      <div key={j} className="truncate">
                        {cell || <span className="text-muted-foreground italic">empty</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isUploading || !!error}
              className="bg-terracotta-500 hover:bg-terracotta-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CSVImport;
