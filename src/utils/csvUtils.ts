
/**
 * Utility functions for CSV import
 */

import { generateId } from "./mealUtils";

interface CSVMealEntry {
  date: string;
  dish: string;
  notes?: string;
}

/**
 * Parse CSV data from a string
 * Expected format: date,dish,notes (optional)
 */
export const parseCSVData = (csvData: string): CSVMealEntry[] => {
  const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Skip header row if it exists
  const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;
  
  return lines.slice(startIndex).map(line => {
    const [date, dish, notes] = line.split(',').map(item => item.trim());
    
    // Validate date
    let parsedDate = new Date(date);
    // If invalid date, use today
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }
    
    return {
      date: parsedDate.toISOString(),
      dish: dish || 'Unknown meal',
      notes: notes || undefined
    };
  }).filter(entry => entry.dish !== 'Unknown meal');
};

/**
 * Process CSV file and return parsed data
 */
export const processCSVFile = (file: File): Promise<CSVMealEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const parsedData = parseCSVData(csvData);
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    
    reader.readAsText(file);
  });
};
