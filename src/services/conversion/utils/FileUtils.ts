
/**
 * Utility functions for handling files during conversion
 */

/**
 * Check if a file should be skipped during transformation
 */
export function shouldSkipFile(fileName: string): boolean {
  const skipExtensions = [
    ".jpg", ".png", ".gif", ".svg", ".mp4", 
    ".mp3", ".pdf", ".ico", ".webp", ".ttf",
    ".woff", ".woff2", ".eot"
  ];
  return skipExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
}

/**
 * Read content from a File object
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error("File reading error"));
    reader.readAsText(file);
  });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

/**
 * Check if file is a component file
 */
export function isComponentFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return (ext === '.tsx' || ext === '.jsx') && 
         !fileName.includes('.test.') && 
         !fileName.includes('.spec.');
}
