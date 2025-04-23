
import { ConversionOptions } from "@/types/conversion";
import { ErrorCollector } from "../../errors/ErrorCollector";
import { transformCode, getTransformationStats } from "../../codeTransformer";
import { ITransformer } from "./ITransformer";
import { FileContentHandler } from "../utils/FileContentHandler";

interface TransformationDetail {
  fileName: string;
  modified: boolean;
  transformations: string[];
}

export class FileTransformHandler {
  private transformers: ITransformer[];
  private errorCollector: ErrorCollector;
  private fileContentHandler: FileContentHandler;

  constructor(transformers: ITransformer[], errorCollector: ErrorCollector) {
    this.transformers = transformers;
    this.errorCollector = errorCollector;
    this.fileContentHandler = new FileContentHandler();
  }

  async transformFile(
    file: File,
    options: ConversionOptions
  ): Promise<TransformationDetail> {
    const result: TransformationDetail = {
      fileName: file.name,
      modified: false,
      transformations: [],
    };

    try {
      if (this.fileContentHandler.shouldSkipFile(file.name)) {
        return result;
      }

      const content = await this.fileContentHandler.readFileContent(file);
      const { transformedCode, appliedTransformations } = transformCode(content);

      if (transformedCode !== content && appliedTransformations.length > 0) {
        result.modified = true;
        result.transformations = appliedTransformations;
      }
      
      for (const transformer of this.transformers) {
        if (transformer.canTransform(file.name)) {
          const transformResult = await transformer.transform(content, options);
          if (transformResult.modified) {
            result.modified = true;
            result.transformations.push(...transformResult.transformations);
          }
        }
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
}
