
/**
 * Fixes for performance monitor issues
 */

/**
 * Safe accessor for performance resource timing properties
 */
export function safeGetResponseHeaders(entry: PerformanceResourceTiming): number {
  // responseHeaders doesn't exist on PerformanceResourceTiming
  // We'll use responseStart instead which is a valid property
  return entry.responseStart;
}

/**
 * Safe accessor for performance entry custom properties
 */
export function safeGetProcessingStart(entry: PerformanceEntry): number {
  // processingStart doesn't exist on base PerformanceEntry
  // For user timing marks, we can use startTime which is safe
  return entry.startTime;
}

/**
 * Type-safe performance monitoring wrapper
 */
export class SafePerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  /**
   * Start measuring a performance mark
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }
  
  /**
   * End measuring and get duration
   */
  measure(name: string, startMark: string): number {
    if (typeof performance !== 'undefined' && this.marks.has(startMark)) {
      const start = this.marks.get(startMark) || 0;
      const end = performance.now();
      
      // Create a measure
      try {
        performance.measure(name, startMark);
      } catch (e) {
        console.warn('Unable to create performance measure:', e);
      }
      
      return end - start;
    }
    return 0;
  }
  
  /**
   * Get all performance metrics
   */
  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    if (typeof performance !== 'undefined') {
      // Get all measures
      const measures = performance.getEntriesByType('measure');
      
      measures.forEach(measure => {
        metrics[measure.name] = measure.duration;
      });
    }
    
    return metrics;
  }
}
