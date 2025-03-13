
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { parseCSVLine } from "@/utils/csvUtils";

interface CSVFileUploaderProps {
  setFile: (file: File | null) => void;
  setPreviewData: (data: string[][]) => void;
  setError: (error: string | null) => void;
}

export const CSVFileUploader = ({ setFile, setPreviewData, setError }: CSVFileUploaderProps) => {
  const { toast } = useToast();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
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
  
  return (
    <div className="space-y-4">
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
    </div>
  );
};
