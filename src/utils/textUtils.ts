// Utility function to add zero-width spaces for better text wrapping
export const addWordBreaks = (text: string, maxLength: number = 20): string => {
  // Split text into words
  const words = text.split(' ');
  
  // Process each word
  const processedWords = words.map(word => {
    // If word is longer than maxLength, add zero-width spaces
    if (word.length > maxLength) {
      // Insert zero-width space every maxLength characters
      let result = '';
      for (let i = 0; i < word.length; i += maxLength) {
        if (i > 0) {
          result += '\u200B'; // Zero-width space
        }
        result += word.slice(i, Math.min(i + maxLength, word.length));
      }
      return result;
    }
    return word;
  });
  
  // Join words back together
  return processedWords.join(' ');
};