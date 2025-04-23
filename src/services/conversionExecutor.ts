
import { ConversionOptions } from '@/types/conversion';
import { transformWithAst } from './astTransformer';

interface ConversionResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  stats: ConversionStats;
}

interface ConversionStats {
  totalFiles: number;
  modifiedFiles: number;
  transformationRate: number;
  dependencyChanges: number;
  routeChanges: number;
}

export class ConversionExecutor {
  private options: ConversionOptions;
  private files: File[];
  private progress: number = 0;
  private progressCallback?: (progress: number, message: string) => void;
  private result: ConversionResult;

  constructor(files: File[], options: ConversionOptions) {
    this.files = files;
    this.options = options;
    this.result = this.initializeResult();
  }

  private initializeResult(): ConversionResult {
    return {
      success: false,
      errors: [],
      warnings: [],
      info: [],
      stats: {
        totalFiles: this.files.length,
        modifiedFiles: 0,
        transformationRate: 0,
        dependencyChanges: 0,
        routeChanges: 0
      }
    };
  }

  setProgressCallback(callback: (progress: number, message: string) => void): this {
    this.progressCallback = callback;
    return this;
  }

  private async updateProgress(increment: number, message: string): Promise<void> {
    this.progress = Math.min(this.progress + increment, 100);
    this.progressCallback?.(this.progress, message);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async execute(): Promise<ConversionResult> {
    try {
      await this.updateProgress(5, "Starting conversion...");
      await this.transformFiles();
      await this.updateProgress(100, "Conversion completed!");
      
      this.result.success = this.result.errors.length === 0;
      return this.result;
    } catch (error) {
      this.result.success = false;
      this.result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      return this.result;
    }
  }

  private async transformFiles(): Promise<void> {
    const progressStep = 90 / this.files.length;

    for (const file of this.files) {
      try {
        const content = await this.readFileContent(file);
        const result = transformWithAst(content);
        
        if (result.changes.length > 0) {
          this.result.stats.modifiedFiles++;
          this.result.info.push(`Transformed ${file.name}:\n${result.changes.join('\n')}`);
        }
        
        if (result.warnings.length > 0) {
          this.result.warnings.push(...result.warnings.map(w => `${file.name}: ${w}`));
        }

        await this.updateProgress(progressStep, `Processing ${file.name}...`);
      } catch (error) {
        this.result.errors.push(`Error processing ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.result.stats.transformationRate = this.result.stats.modifiedFiles / this.files.length;
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsText(file);
    });
  }
}
