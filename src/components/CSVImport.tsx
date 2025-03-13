import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { useDataImport } from "@/hooks/import";
import { CSVPreview } from "./csv/CSVPreview";
import { CSVFileUploader } from "./csv/CSVFileUploader";
import { CSVImportProgress } from "./csv/CSVImportProgress";
import { CSVErrorMessage } from "./csv/CSVErrorMessage";
import { CSVImportButtonContent } from "./csv/CSVImportButtonContent";
import { processCSVFile } from "@/utils/csvUtils";
import { useToast } from "@/hooks/use-toast";

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
  const [error, setError] = useState<string | null>(null);
  
  const handleImport = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Process the CSV file to get entries
      const entries = await processCSVFile(file);
      
      if (entries.length === 0) {
        throw new Error("No valid entries found in the CSV file. Please check the format.");
      }
      
      // Import the entries with progress updates
      const result = await importMealHistory(entries, (processed, total) => {
        const progressPercentage = Math.floor((processed / total) * 100);
        console.log(`Import progress: ${processed}/${total} (${progressPercentage}%)`);
        setProgress(progressPercentage);
      });
      
      // Ensure we always show 100% at the end for better UX
      setProgress(100);
      
      // Wait a moment to show 100% progress before closing dialog
      setTimeout(() => {
        setIsDialogOpen(false);
        setFile(null);
        setPreviewData([]);
        setProgress(0);
        
        // Show appropriate success or warning message
        if (result.success > 0) {
          toast({
            title: "Import complete",
            description: `Successfully imported ${result.success} meals. ${result.skipped} duplicates or invalid entries were skipped.${result.errors ? ` ${result.errors} dishes had errors.` : ''}`,
          });
        } else if (result.errors > 0) {
          toast({
            title: "Import failed",
            description: `No meals imported due to errors. Please check the console logs for details.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Nothing to import",
            description: `No new meals were imported. ${result.skipped} entries were skipped (already exist or invalid format).`,
            variant: "destructive", 
          });
        }
        
        if (onImportComplete) {
          onImportComplete();
        }
      }, 1000);
    } catch (error) {
      console.error("Import failed:", error);
      let errorMessage = "An unknown error occurred during import";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for common database errors with improved detection
      if (typeof error === 'object' && error !== null) {
        const supabaseError = error as any;
        if (supabaseError.code === '42501' || 
            (supabaseError.message && typeof supabaseError.message === 'string' && 
             (supabaseError.message.includes('permission denied') || 
              supabaseError.message.includes('must be owner')))) {
          errorMessage = "Database permission error. You don't have the required permissions.";
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Reset progress on error
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
            <CSVFileUploader 
              setFile={setFile}
              setPreviewData={setPreviewData}
              setError={setError}
            />
            
            {error && <CSVErrorMessage error={error} />}
            
            {previewData.length > 0 && <CSVPreview previewData={previewData} />}
            
            {isUploading && <CSVImportProgress progress={progress} />}
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
              {isUploading ? <CSVImportButtonContent /> : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CSVImport;
