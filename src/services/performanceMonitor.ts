
/**
 * Performance monitoring options
 */
export interface PerformanceMonitorOptions {
  debugMode?: boolean;
  collectMemory?: boolean;
  sampleInterval?: number;
}

/**
 * Performance metrics data structure
 */
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  timestamps: {
    start: number;
    end?: number;
  };
  markers: Record<string, number>;
}

/**
 * Monitors performance metrics during the conversion process
 */
export class PerformanceMonitor {
  private options: PerformanceMonitorOptions;
  private startTime: number = 0;
  private endTime: number = 0;
  private markers: Record<string, number> = {};
  private memorySnapshots: any[] = [];
  
  constructor(options?: PerformanceMonitorOptions) {
    this.options = {
      debugMode: false,
      collectMemory: true,
      sampleInterval: 1000,
      ...options
    };
  }
  
  /**
   * Start measuring performance
   */
  startMeasurement(): void {
    this.startTime = performance.now();
    this.markers = {};
    this.memorySnapshots = [];
    
    if (this.options.debugMode) {
      console.debug('Performance monitoring started');
    }
  }
  
  /**
   * End the performance measurement
   */
  endMeasurement(): void {
    this.endTime = performance.now();
    
    if (this.options.debugMode) {
      console.debug(`Performance monitoring ended. Duration: ${this.getExecutionTime()}ms`);
    }
  }
  
  /**
   * Add a marker at the current time
   */
  addMarker(name: string): void {
    this.markers[name] = performance.now();
  }
  
  /**
   * Capture current memory usage if available
   */
  captureMemoryUsage(): void {
    // In browser environment, we have limited access to memory usage
    if (typeof window !== 'undefined' && window.performance && (performance as any).memory) {
      this.memorySnapshots.push({
        timestamp: performance.now(),
        memory: { ...(performance as any).memory }
      });
    }
  }
  
  /**
   * Get total execution time in milliseconds
   */
  getExecutionTime(): number {
    const endTime = this.endTime || performance.now();
    return endTime - this.startTime;
  }
  
  /**
   * Get all performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const endTime = this.endTime || performance.now();
    
    let memoryUsage;
    if (this.memorySnapshots.length > 0) {
      const lastSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
      memoryUsage = lastSnapshot.memory;
    }
    
    return {
      executionTime: endTime - this.startTime,
      memoryUsage,
      timestamps: {
        start: this.startTime,
        end: endTime
      },
      markers: this.markers
    };
  }
}
