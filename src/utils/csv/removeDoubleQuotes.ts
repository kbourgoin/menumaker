
/**
 * Remove double quotes from a string if it's surrounded by them
 */
export const removeDoubleQuotes = (str: string): string => {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.substring(1, str.length - 1);
  }
  return str;
};
