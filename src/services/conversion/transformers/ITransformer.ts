
import { ConversionOptions } from "@/types/conversion";

export interface TransformationResult {
  modified: boolean;
  transformations: string[];
  warnings: string[];
}

export interface ITransformer {
  transform(content: string, options: ConversionOptions): Promise<TransformationResult>;
  canTransform(fileName: string): boolean;
}
