
import { ConversionOptions } from "@/types/conversion";
import { ITransformer, TransformationResult } from "./ITransformer";

export abstract class BaseTransformer implements ITransformer {
  protected supportedExtensions: string[] = [];

  constructor(extensions: string[] = []) {
    this.supportedExtensions = extensions;
  }

  abstract transform(content: string, options: ConversionOptions): Promise<TransformationResult>;

  canTransform(fileName: string): boolean {
    return this.supportedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }
}
