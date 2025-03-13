
import { removeDoubleQuotes } from "./removeDoubleQuotes";

/**
 * More robust CSV parsing that handles quoted fields with commas
 */
export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field, not inside quotes
      result.push(currentField);
      currentField = '';
    } else {
      // Regular character, add to current field
      currentField += char;
    }
  }
  
  // Add the last field
  result.push(currentField);
  
  // Clean up each field
  return result.map(field => removeDoubleQuotes(field.trim()));
};
