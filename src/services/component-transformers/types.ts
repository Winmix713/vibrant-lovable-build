
/**
 * Types for component transformation
 */
export interface ComponentTransformOptions {
  preserveProps?: boolean;
  wrapInSuspense?: boolean;
  generateFallback?: boolean;
}

export interface ComponentTransformResult {
  code: string;
  imports: string[];
  warnings: string[];
}
