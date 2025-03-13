
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
