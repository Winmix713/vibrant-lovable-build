
import { ConversionOptions } from "@/types/conversion";
import { ErrorCollector } from "../errors/ErrorCollector";
import { transformCode } from "../codeTransformer/core";

export class FileTransformService {
  private errorCollector: ErrorCollector;

  constructor(errorCollector: ErrorCollector) {
    this.errorCollector = errorCollector;
  }

  async transformFile(file: File, options: ConversionOptions) {
    try {
      const content = await this.readFileContent(file);
      const { transformedCode, appliedTransformations } = transformCode(content);

      return {
        fileName: file.name,
        modified: content !== transformedCode,
        transformations: appliedTransformations
      };
    } catch (error) {
      this.errorCollector.addError({
        code: "FILE_TRANSFORM_ERROR",
        severity: "warning",
        message: `Error transforming file ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
        file: file.name,
      });

      return {
        fileName: file.name,
        modified: false,
        transformations: []
      };
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }

  private shouldSkipFile(fileName: string): boolean {
    const skipExtensions = [".jpg", ".png", ".gif", ".svg", ".mp4", ".mp3", ".pdf", ".ico"];
    return skipExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  }
}
