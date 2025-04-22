
import { detectMiddlewareType, transformMiddleware } from "../middlewareTransformer";
import { ErrorCollector } from "../errors/ErrorCollector";

/**
 * Handles the conversion of Next.js middleware to Express middleware
 */
export class MiddlewareHandler {
  private files: File[];
  private errorCollector: ErrorCollector;
  
  constructor(files: File[], errorCollector: ErrorCollector) {
    this.files = files;
    this.errorCollector = errorCollector;
  }
  
  /**
   * Handle middleware conversion for the project
   */
  async handleMiddlewares(): Promise<{
    convertedFiles: string[];
    middlewareCount: number;
  }> {
    const middlewareFiles = this.files.filter(file => 
      file.name.includes('middleware.ts') || 
      file.name.includes('middleware.js')
    );
    
    const convertedFiles: string[] = [];
    
    for (const file of middlewareFiles) {
      try {
        const content = await this.readFileContent(file);
        const type = detectMiddlewareType(content);
        const transformed = transformMiddleware(content, type);
        
        convertedFiles.push(file.name);
      } catch (error) {
        this.errorCollector.addError({
          code: 'MIDDLEWARE_CONVERSION_ERROR',
          severity: 'warning',
          message: `Error converting middleware ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
          file: file.name
        });
      }
    }
    
    return {
      convertedFiles,
      middlewareCount: middlewareFiles.length
    };
  }
  
  /**
   * Read file content
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }
}
