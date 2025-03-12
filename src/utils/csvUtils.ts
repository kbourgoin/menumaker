
/**
 * Utility functions for CSV import
 */

import { generateId } from "./mealUtils";

interface CSVDishEntry {
  date: string;
  dish: string;
  notes?: string;
  source?: {
    type: 'url' | 'book' | 'none';
    value: string;
    page?: number;
    bookId?: string; // Added bookId property to match the type in types/index.ts
  };
}

/**
 * Extract source information from dish name if it contains parentheses
 * Example: "Mapo Tofu (RICE80)" -> { dishName: "Mapo Tofu", source: { type: "book", value: "RICE", page: 80 } }
 * Also handles cases like: "Pasta (6ING47)" -> { dishName: "Pasta", source: { type: "book", value: "6ING", page: 47 } }
 */
export const extractSourceFromDish = (dish: string): { dishName: string; source?: { type: 'url' | 'book' | 'none'; value: string; page?: number } } => {
  // Check if dish contains parentheses at the end
  const matches = dish.match(/^(.*?)\s*\((.*?)\)$/);
  
  if (!matches) {
    return { dishName: dish.trim() };
  }
  
  const [_, dishName, sourceInfo] = matches;
  
  // More sophisticated regex to handle book names with numbers followed by page number
  // This matches any alphanumeric characters for the book name, followed by digits for the page
  const bookPageMatch = sourceInfo.match(/^([A-Za-z0-9 ]+?)([0-9]+)$/);
  
  if (bookPageMatch) {
    const [__, bookName, pageNum] = bookPageMatch;
    return { 
      dishName: dishName.trim(),
      source: {
        type: 'book',
        value: bookName.trim(),
        page: parseInt(pageNum, 10)
      }
    };
  }
  
  // Check if it's a URL source
  if (sourceInfo.toLowerCase() === 'pdf' || sourceInfo.toLowerCase().includes('http')) {
    return {
      dishName: dishName.trim(),
      source: {
        type: 'url',
        value: sourceInfo.toLowerCase() === 'pdf' ? 'PDF Document' : sourceInfo
      }
    };
  }
  
  // If it's something else in parentheses, just treat it as a book
  return {
    dishName: dishName.trim(),
    source: {
      type: 'book',
      value: sourceInfo.trim()
    }
  };
};

/**
 * Remove double quotes from a string if it's surrounded by them
 */
export const removeDoubleQuotes = (str: string): string => {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.substring(1, str.length - 1);
  }
  return str;
};

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
  return result.map(field => field.trim());
};

/**
 * Parse CSV data from a string
 * Expected format: date,dish,notes (optional)
 */
export const parseCSVData = (csvData: string): CSVDishEntry[] => {
  const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Skip header row if it exists
  const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;
  
  return lines.slice(startIndex).map(line => {
    // Use the more robust CSV parsing function that handles quoted fields
    const [date, dish, notes] = parseCSVLine(line);
    
    // Validate date
    let parsedDate = new Date(date);
    // If invalid date, use today
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }
    
    // Remove double quotes from dish name if present
    const cleanedDish = removeDoubleQuotes(dish || 'Unknown meal');
    
    // Extract source information from dish name if available
    const { dishName, source } = extractSourceFromDish(cleanedDish);
    
    // Also remove double quotes from notes if present
    const cleanedNotes = notes ? removeDoubleQuotes(notes) : undefined;
    
    return {
      date: parsedDate.toISOString(),
      dish: dishName,
      notes: cleanedNotes,
      source
    };
  }).filter(entry => entry.dish !== 'Unknown meal');
};

/**
 * Process CSV file and return parsed data
 */
export const processCSVFile = (file: File): Promise<CSVDishEntry[]> => {
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
