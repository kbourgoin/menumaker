
/**
 * Utility functions for CSV import
 */

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
  return result.map(field => removeDoubleQuotes(field.trim()));
};

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
