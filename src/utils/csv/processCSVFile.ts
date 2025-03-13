
import { parseCSVData } from "./parseCSVData";

/**
 * Process CSV file and return parsed data
 */
export const processCSVFile = (file: File): Promise<{ date: string; dish: string; notes?: string; source?: { type: 'url' | 'book' | 'none'; value: string; page?: number } }[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        console.log(`Processing CSV file of size ${csvData.length} bytes`);
        const parsedData = parseCSVData(csvData);
        console.log(`Successfully parsed ${parsedData.length} entries from CSV`);
        resolve(parsedData);
      } catch (error) {
        console.error('Failed to parse CSV file:', error);
        reject(new Error('Failed to parse CSV file. Please check the format and try again.'));
      }
    };
    
    reader.onerror = (event) => {
      console.error('Failed to read CSV file:', event);
      reject(new Error('Failed to read CSV file. The file might be corrupted.'));
    };
    
    reader.readAsText(file);
  });
};
