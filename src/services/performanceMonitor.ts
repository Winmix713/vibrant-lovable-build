
// Performance monitoring service

interface ResourceMetrics {
  url: string;
  duration: number;
  size: number;
  type: string;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
}

interface PerformanceMetrics {
  timeToFirstByte: number;
  firstPaint: number;
  firstContentfulPaint: number;
  domContentLoaded: number;
  domInteractive: number;
  loadComplete: number;
  resources: ResourceMetrics[];
  totalResources: number;
  totalBytes: number;
  totalDuration: number;
  longestResource: ResourceMetrics | null;
  javascriptBytes: number;
  cssBytes: number;
  imageBytes: number;
  fontBytes: number;
  otherBytes: number;
}

export class PerformanceMonitor {
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined' || !window.performance) {
      console.warn('Performance API not supported');
      return;
    }

    if (this.initialized) return;
    this.initialized = true;

    // Listen for navigation events
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'navigation') {
            this.processNavigationTiming(entry as PerformanceNavigationTiming);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('PerformanceObserver for navigation not supported', error);
    }

    // Listen for paint events (FP, FCP)
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-paint') {
            console.log('First Paint:', entry.startTime);
          } else if (entry.name === 'first-contentful-paint') {
            console.log('First Contentful Paint:', entry.startTime);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('PerformanceObserver for paint not supported', error);
    }

    // Listen for resource loads
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.processResourceTiming(entries as PerformanceResourceTiming[]);
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('PerformanceObserver for resources not supported', error);
    }
  }

  private processNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      timeToFirstByte: entry.responseStart - entry.requestStart,
      firstPaint: 0, // Will be populated separately via paint observer
      firstContentfulPaint: 0, // Will be populated separately via paint observer
      domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      loadComplete: entry.loadEventEnd - entry.fetchStart
    };

    console.log('Navigation Timing:', metrics);
  }

  private processResourceTiming(entries: PerformanceResourceTiming[]) {
    const resources: ResourceMetrics[] = entries.map(entry => {
      // Fix for responseHeaders property which doesn't exist
      const headerSize = 0; // We would calculate this if the property existed

      return {
        url: entry.name,
        duration: entry.duration,
        size: entry.decodedBodySize + headerSize,
        type: this.getResourceType(entry.name),
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        initiatorType: entry.initiatorType
      };
    });

    // Process resource data
    let totalBytes = 0;
    let totalDuration = 0;
    let longestResource: ResourceMetrics | null = null;
    const bytesByType = {
      javascript: 0,
      css: 0,
      image: 0,
      font: 0,
      other: 0
    };

    resources.forEach(resource => {
      totalBytes += resource.size;
      totalDuration += resource.duration;

      if (!longestResource || resource.duration > longestResource.duration) {
        longestResource = resource;
      }

      switch (resource.type) {
        case 'javascript':
          bytesByType.javascript += resource.size;
          break;
        case 'css':
          bytesByType.css += resource.size;
          break;
        case 'image':
          bytesByType.image += resource.size;
          break;
        case 'font':
          bytesByType.font += resource.size;
          break;
        default:
          bytesByType.other += resource.size;
          break;
      }
    });

    const resourceMetrics = {
      resources,
      totalResources: resources.length,
      totalBytes,
      totalDuration,
      longestResource,
      javascriptBytes: bytesByType.javascript,
      cssBytes: bytesByType.css,
      imageBytes: bytesByType.image,
      fontBytes: bytesByType.font,
      otherBytes: bytesByType.other
    };

    console.log('Resource Performance:', resourceMetrics);
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    const urlLower = url.toLowerCase();

    if (/\.js(\?|$)/.test(urlLower) || /\.jsx(\?|$)/.test(urlLower) || /\.ts(\?|$)/.test(urlLower) || /\.tsx(\?|$)/.test(urlLower)) {
      return 'javascript';
    } else if (/\.css(\?|$)/.test(urlLower)) {
      return 'css';
    } else if (/\.jpe?g(\?|$)/.test(urlLower) || /\.png(\?|$)/.test(urlLower) || /\.gif(\?|$)/.test(urlLower) || /\.webp(\?|$)/.test(urlLower) || /\.svg(\?|$)/.test(urlLower)) {
      return 'image';
    } else if (/\.woff2?(\?|$)/.test(urlLower) || /\.ttf(\?|$)/.test(urlLower) || /\.eot(\?|$)/.test(urlLower) || /\.otf(\?|$)/.test(urlLower)) {
      return 'font';
    } else {
      return 'other';
    }
  }

  // Public methods
  public collectMetrics(): PerformanceMetrics | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    // Get navigation timing data
    const navEntries = performance.getEntriesByType('navigation');
    if (!navEntries.length) {
      return null;
    }

    const navTiming = navEntries[0] as PerformanceNavigationTiming;

    // Get paint timing data
    const paintEntries = performance.getEntriesByType('paint');
    let firstPaint = 0;
    let firstContentfulPaint = 0;

    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        firstContentfulPaint = entry.startTime;
      }
    });

    // Get resource timing data
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const resources: ResourceMetrics[] = resourceEntries.map(entry => {
      return {
        url: entry.name,
        duration: entry.duration,
        size: entry.decodedBodySize,
        type: this.getResourceType(entry.name),
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        initiatorType: entry.initiatorType
      };
    });

    // Process resource data
    let totalBytes = 0;
    let totalDuration = 0;
    let longestResource: ResourceMetrics | null = null;
    const bytesByType = {
      javascript: 0,
      css: 0,
      image: 0,
      font: 0,
      other: 0
    };

    resources.forEach(resource => {
      totalBytes += resource.size;
      totalDuration += resource.duration;

      if (!longestResource || resource.duration > longestResource.duration) {
        longestResource = resource;
      }

      switch (resource.type) {
        case 'javascript':
          bytesByType.javascript += resource.size;
          break;
        case 'css':
          bytesByType.css += resource.size;
          break;
        case 'image':
          bytesByType.image += resource.size;
          break;
        case 'font':
          bytesByType.font += resource.size;
          break;
        default:
          bytesByType.other += resource.size;
          break;
      }
    });

    return {
      timeToFirstByte: navTiming.responseStart - navTiming.requestStart,
      firstPaint,
      firstContentfulPaint,
      domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.fetchStart,
      domInteractive: navTiming.domInteractive - navTiming.fetchStart,
      loadComplete: navTiming.loadEventEnd - navTiming.fetchStart,
      resources,
      totalResources: resources.length,
      totalBytes,
      totalDuration,
      longestResource,
      javascriptBytes: bytesByType.javascript,
      cssBytes: bytesByType.css,
      imageBytes: bytesByType.image,
      fontBytes: bytesByType.font,
      otherBytes: bytesByType.other
    };
  }

  // Process and log long tasks
  public monitorLongTasks() {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!('processingStart' in entry)) return;
          const processingStart = (entry as any).processingStart;
          const processingDuration = entry.duration;
          
          if (processingDuration > 50) {
            console.warn(`Long task detected: ${Math.round(processingDuration)}ms`, entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long Tasks API not supported', error);
    }
  }
}

export default PerformanceMonitor;
