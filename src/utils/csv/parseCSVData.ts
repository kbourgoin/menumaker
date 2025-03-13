
import { parseCSVLine } from "./parseCSVLine";
import { extractSourceFromDish } from "./extractSourceFromDish";

/**
 * Parse CSV data from a string
 * Expected format: date,dish,notes (optional)
 */
export const parseCSVData = (csvData: string): { date: string; dish: string; notes?: string; source?: { type: 'url' | 'book' | 'none'; value: string; page?: number } }[] => {
  const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Skip header row if it exists (case insensitive check for "date" or "dish" in first row)
  const startIndex = (lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('dish')) ? 1 : 0;
  
  console.log(`CSV data has ${lines.length} lines, starting at index ${startIndex}`);
  
  return lines.slice(startIndex).map((line, idx) => {
    // Use the more robust CSV parsing function that handles quoted fields
    const fields = parseCSVLine(line);
    const [date, dish, notes] = fields;
    
    if (!date || !dish) {
      console.warn(`Line ${idx + startIndex + 1} is missing date or dish: ${line}`);
      return null;
    }
    
    // Validate date
    let parsedDate = new Date(date);
    // If invalid date, use today
    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date in line ${idx + startIndex + 1}: ${date}, using current date instead`);
      parsedDate = new Date();
    }
    
    // Remove double quotes from dish name if present
    const cleanedDish = dish || 'Unknown meal';
    
    // Extract source information from dish name if available
    const { dishName, source } = extractSourceFromDish(cleanedDish);
    
    return {
      date: parsedDate.toISOString(),
      dish: dishName,
      notes: notes,
      source
    };
  }).filter(entry => entry !== null && entry.dish !== 'Unknown meal');
};
