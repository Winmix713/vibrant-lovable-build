
/**
 * Type definitions for component analysis
 */
export interface AnalyzedComponent {
  name: string;
  type: 'functional' | 'class' | 'unknown';
  imports: string[];
  nextJsImports: string[];
  props: string[];
}

export interface ComponentUsageAnalysis {
  used: boolean;
  count: number;
  imports: string[];
}
