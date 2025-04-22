import { ConversionOptions } from "@/types/conversion";
import { transformCode, getTransformationStats } from "../codeTransformer";
import { transformComponent } from "../componentTransformer";
import { ErrorCollector } from "../errors/ErrorCollector";
import { analyzeComponentUsage } from "./ComponentAnalyzer"; // Import the new analyzer utility

/**
 * Handles the transformation of source files during conversion
 */
export class FileTransformer {
  private files: File[];
  private errorCollector: ErrorCollector;

  constructor(files: File[], errorCollector: ErrorCollector) {
    this.files = files;
    this.errorCollector = errorCollector;
  }

  /**
   * Transform all project files based on conversion options
   */
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
      // Process files in batches for better performance
      const batchSize = 5;
      const totalFiles = this.files.length;
      const details: string[] = [];

      for (let i = 0; i < totalFiles; i += batchSize) {
        const batch = this.files.slice(i, Math.min(i + batchSize, totalFiles));

        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            return this.transformFile(file, options);
          })
        );

        // Collect results
        batchResults.forEach((batchResult) => {
          if (batchResult.modified) {
            result.transformedFiles.push(batchResult.fileName);
            result.modifiedFiles++;
            details.push(
              `Transformations in file: ${batchResult.fileName}\n${batchResult.transformations.join(
                "\n"
              )}`
            );
          }
        });
      }

      // Calculate transformation rate
      result.transformationRate = result.modifiedFiles / totalFiles;
      result.details = details;

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

  /**
   * Transform a single file
   */
  private async transformFile(
    file: File,
    options: ConversionOptions
  ): Promise<{
    fileName: string;
    modified: boolean;
    transformations: string[];
  }> {
    const result = {
      fileName: file.name,
      modified: false,
      transformations: [] as string[],
    };

    try {
      // Skip non-code files
      if (this.shouldSkipFile(file.name)) {
        return result;
      }

      // Get file content
      const content = await this.readFileContent(file);

      // Transform code
      const { transformedCode, appliedTransformations } = transformCode(content);

      // Check if the file was modified
      if (transformedCode !== content && appliedTransformations.length > 0) {
        result.modified = true;
        result.transformations = appliedTransformations;
      }

      return result;
    } catch (error) {
      this.errorCollector.addError({
        code: "FILE_TRANSFORM_ERROR",
        severity: "warning",
        message: `Error transforming file ${file.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        file: file.name,
      });

      return result;
    }
  }

  /**
   * Replace Next.js specific components with Vite/React compatible alternatives
   */
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
      // Components to replace: Image, Link, Head, Script, Dynamic
      const componentTypes = ["image", "link", "head", "script", "dynamic"];

      for (const file of this.files) {
        // Skip non-code files
        if (
          this.shouldSkipFile(file.name) ||
          (!file.name.endsWith(".tsx") && !file.name.endsWith(".jsx"))
        ) {
          continue;
        }

        try {
          const content = await this.readFileContent(file);

          for (const componentType of componentTypes) {
            // Use AST-based analysis to detect component usage
            const usage = analyzeComponentUsage(content, componentType);

            if (usage.used) {
              const transformResult = transformComponent(
                content,
                componentType
              );

              if (transformResult.code !== content) {
                result.replacedComponents.push({
                  file: file.name,
                  component: componentType,
                  count: usage.count,
                });

                // Add warnings from the component transformation
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

  /**
   * Check if file should be skipped
   */
  private shouldSkipFile(fileName: string): boolean {
    // Skip non-code files
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
