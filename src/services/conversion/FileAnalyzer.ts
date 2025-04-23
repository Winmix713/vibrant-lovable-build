
import { ErrorCollector } from "../errors/ErrorCollector";

export class FileAnalyzer {
  private files: File[];
  private errorCollector: ErrorCollector;

  constructor(files: File[], errorCollector: ErrorCollector) {
    this.files = files;
    this.errorCollector = errorCollector;
  }

  async analyzeFiles(): Promise<{
    apiRoutes: string[];
    staticFiles: string[];
    componentFiles: string[];
    styles: string[];
  }> {
    const apiRoutes: string[] = [];
    const staticFiles: string[] = [];
    const componentFiles: string[] = [];
    const styles: string[] = [];

    this.files.forEach(file => {
      const path = file.name;
      if (path.includes('/api/')) {
        apiRoutes.push(path);
      } else if (path.match(/\.(jpg|png|gif|svg|ico)$/i)) {
        staticFiles.push(path);
      } else if (path.match(/\.(css|scss)$/i)) {
        styles.push(path);
      } else if (path.match(/\.(tsx|jsx)$/i)) {
        componentFiles.push(path);
      }
    });

    return {
      apiRoutes,
      staticFiles,
      componentFiles,
      styles
    };
  }
}
