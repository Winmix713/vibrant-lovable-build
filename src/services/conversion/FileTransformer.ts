import { ConversionOptions } from "@/types/conversion";
import { ErrorCollector } from "../errors/ErrorCollector";
import { ITransformer } from "./transformers/ITransformer";
import { ComponentTransformer } from "./transformers/ComponentTransformer";
import { FileTransformHandler } from "./transformers/FileTransformHandler";

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
            const usage = analyzeComponentUsage(content, componentType);

            if (usage.used) {
              const transformResult = transformComponent(content, componentType);

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
