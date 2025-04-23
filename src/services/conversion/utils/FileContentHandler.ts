
/**
 * Handles file content reading and validation
 */
export class FileContentHandler {
  private skipExtensions = [
    ".jpg", ".png", ".gif", ".svg", ".mp4", 
    ".mp3", ".pdf", ".ico", ".webp", ".ttf",
    ".woff", ".woff2", ".eot"
  ];

  shouldSkipFile(fileName: string): boolean {
    return this.skipExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  }

  async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }
}
