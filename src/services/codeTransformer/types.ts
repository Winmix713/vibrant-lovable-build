
/**
 * Type definitions for code transformation rules
 */
export interface TransformationRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  category: 'component' | 'routing' | 'data-fetching' | 'api' | 'config' | 'general';
}

export interface TransformationResult {
  transformedCode: string;
  appliedTransformations: string[];
}

export interface TransformationStats {
  totalRules: number;
  appliedRules: number;
  modificationRate: number;
  complexity: {
    simple: number;
    medium: number;
    complex: number;
  };
  categories: Record<string, number>;
}
