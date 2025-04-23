
import { ConversionOptions } from "@/types/conversion";
import { ErrorCollector } from "../errors/ErrorCollector";
import { ITransformer } from "./transformers/ITransformer";
import { ComponentTransformer } from "./transformers/ComponentTransformer";
import { FileTransformHandler } from "./transformers/FileTransformHandler";
import { ComponentUsageStats } from "./ComponentAnalyzer";

export class FileTransformer {
  private files: File[];
  private errorCollector: ErrorCollector;
  private transformHandler: FileTransformHandler;

  constructor(files: File[], errorCollector: ErrorCollector) {
    this.files = files;
    this.errorCollector = errorCollector;
    const transformers = [
      new ComponentTransformer()
      // Additional transformers can be added here
    ];
    this.transformHandler = new FileTransformHandler(transformers, errorCollector);
  }

  async transformFiles(options: ConversionOptions): Promise<{
    transformedFiles: string[];
    modifiedFiles: number;
    transformationRate: number;
    details: string[];
  }> {
    const result = {
      transformedFiles: [] as string[],
      modifiedFiles: 0,
      transformationRate: 0,
      details: [] as string[],
    };

    try {
      const batchSize = 5;
      const totalFiles = this.files.length;

      for (let i = 0; i < totalFiles; i += batchSize) {
        const batch = this.files.slice(i, Math.min(i + batchSize, totalFiles));
        const batchResults = await Promise.all(
          batch.map(file => this.transformHandler.transformFile(file, options))
        );

        batchResults.forEach((batchResult) => {
          if (batchResult.modified) {
            result.transformedFiles.push(batchResult.fileName);
            result.modifiedFiles++;
            result.details.push(
              `Transformations in file: ${batchResult.fileName}\n${batchResult.transformations.join("\n")}`
            );
          }
        });
      }

      result.transformationRate = result.modifiedFiles / totalFiles;
      return result;
    } catch (error) {
      this.errorCollector.addError({
        code: "FILE_TRANSFORM_FAILED",
        severity: "critical",
        message: `Error during file transformation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });

      return result;
    }
  }

  async replaceComponents(): Promise<{
    replacedComponents: { file: string; component: string; count: number }[];
  }> {
    const result = {
      replacedComponents: [] as {
        file: string;
        component: string;
        count: number;
      }[],
    };

    try {
      const componentTypes = ["image", "link", "head", "script", "dynamic"];

      for (const file of this.files) {
        if (
          this.shouldSkipFile(file.name) ||
          (!file.name.endsWith(".tsx") && !file.name.endsWith(".jsx"))
        ) {
          continue;
        }

        try {
          const content = await this.readFileContent(file);

          for (const componentType of componentTypes) {
            const usage = this.analyzeComponentUsage(content, componentType);

            if (usage.used) {
              const transformResult = this.transformComponent(content, componentType);

              if (transformResult.code !== content) {
                result.replacedComponents.push({
                  file: file.name,
                  component: componentType,
                  count: usage.count,
                });

                transformResult.warnings.forEach((warning) => {
                  this.errorCollector.addError({
                    code: `COMPONENT_TRANSFORM_WARNING`,
                    severity: "warning",
                    message: warning,
                    file: file.name,
                  });
                });
              }
            }
          }
        } catch (error) {
          this.errorCollector.addError({
            code: "COMPONENT_REPLACE_ERROR",
            severity: "warning",
            message: `Error replacing components in ${file.name}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            file: file.name,
          });
        }
      }

      return result;
    } catch (error) {
      this.errorCollector.addError({
        code: "COMPONENT_REPLACE_FAILED",
        severity: "warning",
        message: `Component replacement process failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });

      return result;
    }
  }
  
  // Implementálunk két hiányzó függvényt
  private analyzeComponentUsage(content: string, componentType: string): ComponentUsageStats {
    // Egyszerűsített elemzés - komplexebb elemzéshez használjuk a ComponentAnalyzer osztályt
    const nextImportRegex = new RegExp(`import\\s+.*?from\\s+['"](next\\/${componentType})['"]`, 'g');
    const jsxComponentRegex = new RegExp(`<(${componentType}|${componentType.charAt(0).toUpperCase() + componentType.slice(1)})\\s+`, 'gi');
    
    const hasNextImport = nextImportRegex.test(content);
    
    // Reset regex indexes
    jsxComponentRegex.lastIndex = 0;
    
    let count = 0;
    while (jsxComponentRegex.exec(content) !== null) {
      count++;
    }
    
    return {
      used: hasNextImport && count > 0,
      count: count
    };
  }
  
  private transformComponent(content: string, componentType: string): { code: string; warnings: string[] } {
    // Egyszerűsített átalakítás - tényleges átalakításhoz használhatunk AST elemzést
    const warnings: string[] = [];
    let transformedCode = content;
    
    // Alap import átalakítás
    transformedCode = transformedCode.replace(
      /import\s+(\w+)\s+from\s+['"]next\/(\w+)['"]/g,
      (match, importName, importType) => {
        if (importType === componentType) {
          return `import ${importName} from 'react-${componentType}'`;
        }
        return match;
      }
    );
    
    // Figyelmeztetés speciális esetekre
    if (componentType === 'image' && (content.includes('placeholder="blur"') || content.includes('blurDataURL'))) {
      warnings.push('Next.js Image blur placeholder might not be fully supported in the converted component');
    }
    
    return {
      code: transformedCode,
      warnings
    };
  }

  private shouldSkipFile(fileName: string): boolean {
    const skipExtensions = [
      ".jpg",
      ".png",
      ".gif",
      ".svg",
      ".mp4",
      ".mp3",
      ".pdf",
      ".ico",
    ];
    return skipExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }
}
