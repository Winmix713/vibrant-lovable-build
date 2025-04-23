
import { ConversionOptions } from "@/types/conversion";
import { ErrorCollector } from "../errors/ErrorCollector";
import { FileTransformService } from "../fileTransformer/FileTransformService";
import { ComponentTransformer } from "./transformers/ComponentTransformer";

export class FileTransformer {
  private files: File[];
  private errorCollector: ErrorCollector;
  private transformService: FileTransformService;
  private componentTransformer: ComponentTransformer;

  constructor(files: File[], errorCollector: ErrorCollector) {
    this.files = files;
    this.errorCollector = errorCollector;
    this.transformService = new FileTransformService(errorCollector);
    this.componentTransformer = new ComponentTransformer();
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
      details: [] as string[]
    };

    try {
      const batchSize = 5;
      const totalFiles = this.files.length;

      for (let i = 0; i < totalFiles; i += batchSize) {
        const batch = this.files.slice(i, Math.min(i + batchSize, totalFiles));
        const batchResults = await Promise.all(
          batch.map(file => this.transformService.transformFile(file, options))
        );

        batchResults.forEach(batchResult => {
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
        message: `Error during file transformation: ${error instanceof Error ? error.message : String(error)}`,
      });

      return result;
    }
  }

  async replaceComponents() {
    return {
      replacedComponents: [] as { file: string; component: string; count: number }[]
    };
  }
}
