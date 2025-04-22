
/**
 * Error types for conversion process
 */
export interface ConversionError {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  recoveryOptions?: string[];
}

/**
 * Centralized error collection and management for the conversion process
 */
export class ErrorCollector {
  private errors: ConversionError[] = [];
  
  /**
   * Add an error to the collection
   */
  addError(error: ConversionError): void {
    this.errors.push(error);
  }
  
  /**
   * Get all errors
   */
  getAllErrors(): ConversionError[] {
    return this.errors;
  }
  
  /**
   * Get critical errors
   */
  getCritical(): ConversionError[] {
    return this.errors.filter(e => e.severity === 'critical');
  }
  
  /**
   * Get warnings
   */
  getWarnings(): ConversionError[] {
    return this.errors.filter(e => e.severity === 'warning');
  }
  
  /**
   * Get informational messages
   */
  getInfo(): ConversionError[] {
    return this.errors.filter(e => e.severity === 'info');
  }
  
  /**
   * Get errors for a specific file
   */
  getByFile(file: string): ConversionError[] {
    return this.errors.filter(e => e.file === file);
  }
  
  /**
   * Check if there are any critical errors
   */
  hasCriticalErrors(): boolean {
    return this.getCritical().length > 0;
  }
  
  /**
   * Get errors by category (e.g., 'typescript', 'component', 'route')
   */
  getByCategory(category: string): ConversionError[] {
    return this.errors.filter(e => e.code.toLowerCase().startsWith(category.toLowerCase()));
  }
  
  /**
   * Generate a report with all errors grouped by severity
   */
  generateReport(): {
    critical: ConversionError[];
    warnings: ConversionError[];
    info: ConversionError[];
    summary: string;
  } {
    const critical = this.getCritical();
    const warnings = this.getWarnings();
    const info = this.getInfo();
    
    const summary = `Conversion process completed with ${critical.length} critical errors, ${warnings.length} warnings, and ${info.length} informational messages.`;
    
    return {
      critical,
      warnings,
      info,
      summary
    };
  }
  
  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }
}
