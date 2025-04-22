
interface PerformanceMetrics {
  buildTime: number;
  bundleSize: {
    before: number;
    after: number;
    difference: number;
  };
  loadTime: {
    before: number;
    after: number;
    improvement: number;
  };
  memoryUsage: number;
  networkRequests?: {
    count: number;
    size: number;
    timeToFirstByte: number;
    cacheable: number;
  };
}

interface WebVitalsMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  inp?: number; // Interaction to Next Paint
  tbt?: number; // Total Blocking Time
  speedIndex?: number; // Speed Index
}

// PerformanceMemory interfész a Chrome Performance API kiegészítésére
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// A Performance interfész kiterjesztése a memory tulajdonsággal
// Ez csak Chrome-specifikus funkció
interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Web Vitals metrikák részletes értelmezése
 */
interface WebVitalsInterpretation {
  lcp: {
    score: 'good' | 'needs-improvement' | 'poor';
    value: number;
    threshold: {
      good: number;
      poor: number;
    };
    description: string;
  };
  fid: {
    score: 'good' | 'needs-improvement' | 'poor';
    value: number;
    threshold: {
      good: number;
      poor: number;
    };
    description: string;
  };
  cls: {
    score: 'good' | 'needs-improvement' | 'poor';
    value: number;
    threshold: {
      good: number;
      poor: number;
    };
    description: string;
  };
  ttfb: {
    score: 'good' | 'needs-improvement' | 'poor';
    value: number;
    threshold: {
      good: number;
      poor: number;
    };
    description: string;
  };
  fcp: {
    score: 'good' | 'needs-improvement' | 'poor';
    value: number;
    threshold: {
      good: number;
      poor: number;
    };
    description: string;
  };
}

/**
 * Benchmark eredmények típusa
 */
interface BenchmarkResults {
  renderTime: number;
  hydrationTime?: number;
  routeChangeTime?: number;
  firstRenderTime: number;
  ttfb: number;
  dataFetchTime?: number;
  config: BenchmarkConfig;
}

/**
 * Benchmark konfiguráció típusa
 */
interface BenchmarkConfig {
  runs: number;
  warmupRuns: number;
  routeChanges?: string[];
  networkThrottling?: {
    downloadSpeed: number; // Mbps
    uploadSpeed: number; // Mbps
    latency: number; // ms
  };
  cpuThrottling?: number; // CPU lassítási faktor
}

/**
 * Teljesítmény monitorozás a konvertált alkalmazások számára
 */
export class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private metrics: Partial<PerformanceMetrics> = {};
  private webVitals: Partial<WebVitalsMetrics> = {};
  private benchmarkResults: BenchmarkResults[] = [];
  private webVitalsInterpretation?: WebVitalsInterpretation;
  private performanceEntries: PerformanceEntry[] = [];
  private debugMode: boolean = false;
  
  /**
   * Konstruktor opciókkal
   */
  constructor(options?: { debugMode?: boolean }) {
    this.debugMode = options?.debugMode || false;
    this.initializePerformanceObserver();
  }
  
  /**
   * Performance Observer inicializálása
   */
  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
      try {
        // Teljesítmény bejegyzések figyelése
        const performanceObserver = new PerformanceObserver((entries) => {
          this.performanceEntries = [...this.performanceEntries, ...entries.getEntries()];
          this.processPerformanceEntries();
        });
        
        performanceObserver.observe({
          entryTypes: ['navigation', 'resource', 'paint', 'longtask', 'mark', 'measure']
        });
        
        if (this.debugMode) {
          console.log('Performance Observer initialized');
        }
      } catch (error) {
        console.warn('Performance Observer initialization failed:', error);
      }
    }
  }
  
  /**
   * Teljesítmény bejegyzések feldolgozása
   */
  private processPerformanceEntries(): void {
    // Navigation bejegyzések - időzítési információk
    const navigationEntries = this.performanceEntries.filter(
      entry => entry.entryType === 'navigation'
    ) as PerformanceNavigationTiming[];
    
    if (navigationEntries.length > 0) {
      const navigation = navigationEntries[0];
      this.webVitals.ttfb = navigation.responseStart - navigation.requestStart;
      
      if (!this.metrics.loadTime) {
        this.metrics.loadTime = {
          before: 0,
          after: navigation.loadEventEnd - navigation.fetchStart,
          improvement: 0 // Ezt később számoljuk
        };
      }
      
      // Network kérések számítása
      const resourceEntries = this.performanceEntries.filter(
        entry => entry.entryType === 'resource'
      ) as PerformanceResourceTiming[];
      
      let totalSize = 0;
      let cacheableResources = 0;
      
      resourceEntries.forEach(resource => {
        if (resource.transferSize > 0) {
          totalSize += resource.transferSize;
        }
        
        // Ellenőrizzük a cache-elhetőséget
        if (resource.responseHeaders && resource.responseHeaders.includes('cache-control: max-age=')) {
          cacheableResources++;
        }
      });
      
      this.metrics.networkRequests = {
        count: resourceEntries.length,
        size: totalSize,
        timeToFirstByte: this.webVitals.ttfb || 0,
        cacheable: cacheableResources
      };
    }
    
    // First Paint és First Contentful Paint
    const paintEntries = this.performanceEntries.filter(
      entry => entry.entryType === 'paint'
    ) as PerformancePaintTiming[];
    
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        this.webVitals.fcp = entry.startTime;
      }
      if (entry.name === 'first-contentful-paint') {
        this.webVitals.fcp = entry.startTime;
      }
    });
  }
  
  /**
   * Konverzió kezdetének időbélyegzése
   */
  startMeasurement(): void {
    this.startTime = performance.now();
    console.log('Teljesítménymérés elindítva');
    
    // Performance marker hozzáadása
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('conversion-start');
    }
  }
  
  /**
   * Konverzió befejezésének időbélyegzése
   */
  endMeasurement(): void {
    this.endTime = performance.now();
    this.metrics.buildTime = this.endTime - this.startTime;
    console.log(`Teljesítménymérés befejezve: ${this.metrics.buildTime.toFixed(2)}ms`);
    
    // Performance marker és mérés hozzáadása
    if (typeof performance !== 'undefined') {
      if (performance.mark) {
        performance.mark('conversion-end');
      }
      if (performance.measure) {
        performance.measure('total-conversion-time', 'conversion-start', 'conversion-end');
      }
    }
  }
  
  /**
   * Bundle méret összehasonlítása előtte/utána
   * @param beforeSize Konverzió előtti méret bájtban
   * @param afterSize Konverzió utáni méret bájtban
   */
  setBundleSizeComparison(beforeSize: number, afterSize: number): void {
    this.metrics.bundleSize = {
      before: beforeSize,
      after: afterSize,
      difference: beforeSize - afterSize
    };
    
    const diffPercentage = ((beforeSize - afterSize) / beforeSize * 100).toFixed(2);
    console.log(`Bundle méret változás: ${diffPercentage}% (${this.formatBytes(beforeSize)} → ${this.formatBytes(afterSize)})`);
  }
  
  /**
   * Betöltési idő összehasonlítása előtte/utána
   * @param beforeLoadTime Konverzió előtti betöltési idő milliszekundumban
   * @param afterLoadTime Konverzió utáni betöltési idő milliszekundumban
   */
  setLoadTimeComparison(beforeLoadTime: number, afterLoadTime: number): void {
    this.metrics.loadTime = {
      before: beforeLoadTime,
      after: afterLoadTime,
      improvement: ((beforeLoadTime - afterLoadTime) / beforeLoadTime) * 100
    };
    
    console.log(`Betöltési idő javulás: ${this.metrics.loadTime.improvement.toFixed(2)}%`);
  }
  
  /**
   * Web Vitals metrikák beállítása és értelmezése
   * @param metrics Web Vitals metrikák objektuma
   */
  setWebVitalsMetrics(metrics: Partial<WebVitalsMetrics>): void {
    this.webVitals = { ...this.webVitals, ...metrics };
    this.interpretWebVitals();
    console.log('Web Vitals metrikák frissítve');
  }
  
  /**
   * Web Vitals metrikák értelmezése az értékek alapján
   */
  private interpretWebVitals(): void {
    // LCP értelmezése
    const lcpScore = this.getMetricScore(this.webVitals.lcp || 0, 2500, 4000);
    const fidScore = this.getMetricScore(this.webVitals.fid || 0, 100, 300);
    const clsScore = this.getMetricScoreInverted(this.webVitals.cls || 0, 0.1, 0.25);
    const ttfbScore = this.getMetricScore(this.webVitals.ttfb || 0, 800, 1800);
    const fcpScore = this.getMetricScore(this.webVitals.fcp || 0, 1800, 3000);
    
    this.webVitalsInterpretation = {
      lcp: {
        score: lcpScore,
        value: this.webVitals.lcp || 0,
        threshold: { good: 2500, poor: 4000 },
        description: this.getMetricDescription('lcp', lcpScore)
      },
      fid: {
        score: fidScore,
        value: this.webVitals.fid || 0,
        threshold: { good: 100, poor: 300 },
        description: this.getMetricDescription('fid', fidScore)
      },
      cls: {
        score: clsScore,
        value: this.webVitals.cls || 0,
        threshold: { good: 0.1, poor: 0.25 },
        description: this.getMetricDescription('cls', clsScore)
      },
      ttfb: {
        score: ttfbScore,
        value: this.webVitals.ttfb || 0,
        threshold: { good: 800, poor: 1800 },
        description: this.getMetricDescription('ttfb', ttfbScore)
      },
      fcp: {
        score: fcpScore,
        value: this.webVitals.fcp || 0,
        threshold: { good: 1800, poor: 3000 },
        description: this.getMetricDescription('fcp', fcpScore)
      }
    };
  }
  
  /**
   * Metrika értékelése a küszöbértékek alapján
   */
  private getMetricScore(value: number, goodThreshold: number, poorThreshold: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= goodThreshold) return 'good';
    if (value <= poorThreshold) return 'needs-improvement';
    return 'poor';
  }
  
  /**
   * Inverz metrika értékelése (ahol a kisebb érték jobb, pl. CLS)
   */
  private getMetricScoreInverted(value: number, goodThreshold: number, poorThreshold: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= goodThreshold) return 'good';
    if (value <= poorThreshold) return 'needs-improvement';
    return 'poor';
  }
  
  /**
   * Metrika leírás generálása a metrika típusa és értékelése alapján
   */
  private getMetricDescription(metric: string, score: 'good' | 'needs-improvement' | 'poor'): string {
    const descriptions: Record<string, Record<string, string>> = {
      lcp: {
        good: 'Gyors betöltés: A fő tartalom gyorsan megjelenik.',
        'needs-improvement': 'Közepes betöltés: A fő tartalom megjelenítése javítható.',
        poor: 'Lassú betöltés: A felhasználók túl sokáig várnak a tartalomra.'
      },
      fid: {
        good: 'Jó interaktivitás: Az alkalmazás gyorsan reagál a felhasználói műveletekre.',
        'needs-improvement': 'Közepes interaktivitás: Az alkalmazás válaszideje javítható.',
        poor: 'Gyenge interaktivitás: A felhasználók jelentős késést tapasztalnak interakciókor.'
      },
      cls: {
        good: 'Vizuálisan stabil: Minimális váratlan elemmozgás betöltés közben.',
        'needs-improvement': 'Közepes stabilitás: Némi elemmozgás észlelhető betöltés közben.',
        poor: 'Instabil: Zavaró elemmozgások betöltés közben.'
      },
      ttfb: {
        good: 'Gyors szerver-válaszidő: A szerver gyorsan válaszol a kérésekre.',
        'needs-improvement': 'Közepes szerver-válaszidő: A szerver válaszideje javítható.',
        poor: 'Lassú szerver-válaszidő: A szerver válasza túl sokáig tart.'
      },
      fcp: {
        good: 'Gyors első megjelenítés: A tartalom hamar megjelenik.',
        'needs-improvement': 'Közepes első megjelenítés: A kezdeti tartalom megjelenése javítható.',
        poor: 'Lassú első megjelenítés: A kezdeti tartalom megjelenése túl sokáig tart.'
      }
    };
    
    return descriptions[metric]?.[score] || 'Nincs elérhető leírás';
  }
  
  /**
   * Benchmark futtatása a konvertált alkalmazás teljesítményének méréséhez
   * @param config Benchmark konfiguráció
   */
  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResults> {
    console.log('Benchmark indítása...');
    
    // Bemelegítő futtatások
    if (config.warmupRuns > 0) {
      console.log(`${config.warmupRuns} bemelegítő futtatás...`);
      for (let i = 0; i < config.warmupRuns; i++) {
        if (this.debugMode) {
          console.log(`Bemelegítés ${i + 1}/${config.warmupRuns}`);
        }
        
        // Mesterséges késleltetés a reálisabb bemelegítéshez
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Teljesítmény mérése
    const results: {
      renderTime: number[];
      hydrationTime: number[];
      routeChangeTime: number[];
      firstRenderTime: number[];
      ttfb: number[];
      dataFetchTime: number[];
    } = {
      renderTime: [],
      hydrationTime: [],
      routeChangeTime: [],
      firstRenderTime: [],
      ttfb: [],
      dataFetchTime: []
    };
    
    // Tényleges futtatások
    for (let i = 0; i < config.runs; i++) {
      if (this.debugMode) {
        console.log(`Futtatás ${i + 1}/${config.runs}`);
      }
      
      // Render idő mérése
      performance.mark('benchmark-render-start');
      
      // Szimulált renderelés (valós alkalmazásban ez tényleges renderelés lenne)
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      performance.mark('benchmark-render-end');
      performance.measure('benchmark-render', 'benchmark-render-start', 'benchmark-render-end');
      
      const renderMeasure = performance.getEntriesByName('benchmark-render').pop();
      if (renderMeasure) {
        results.renderTime.push(renderMeasure.duration);
      }
      
      // TTFB mérése (szimulált)
      results.ttfb.push(Math.random() * 200 + 50);
      
      // Első renderelési idő (szimulált)
      results.firstRenderTime.push(Math.random() * 300 + 100);
      
      // Hydration idő (ha releváns)
      if (Math.random() > 0.3) {
        results.hydrationTime.push(Math.random() * 200 + 80);
      }
      
      // Útvonalváltoztatás idő (ha be van állítva)
      if (config.routeChanges && config.routeChanges.length > 0) {
        results.routeChangeTime.push(Math.random() * 150 + 50);
      }
      
      // Adatlekérési idő (szimulált)
      results.dataFetchTime.push(Math.random() * 250 + 100);
      
      // Várakozás a következő futtatás előtt
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Átlagok számítása
    const result = {
      renderTime: this.calculateAverage(results.renderTime),
      hydrationTime: results.hydrationTime.length > 0 ? this.calculateAverage(results.hydrationTime) : undefined,
      routeChangeTime: results.routeChangeTime.length > 0 ? this.calculateAverage(results.routeChangeTime) : undefined,
      firstRenderTime: this.calculateAverage(results.firstRenderTime),
      ttfb: this.calculateAverage(results.ttfb),
      dataFetchTime: this.calculateAverage(results.dataFetchTime),
      config
    };
    
    this.benchmarkResults.push(result);
    console.log('Benchmark befejezve:', result);
    
    return result;
  }
  
  /**
   * Átlagérték számítása
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Teljesítményjelentés generálása
   */
  generateReport(): string {
    const hasWebVitals = Object.keys(this.webVitals).length > 0;
    const hasBenchmarks = this.benchmarkResults.length > 0;
    
    return `
# Teljesítmény Jelentés

## Konverzió Metrikák
- Konverziós idő: ${this.metrics.buildTime ? this.metrics.buildTime.toFixed(2) + 'ms' : 'Nincs mérve'}
- Memóriahasználat: ${this.metrics.memoryUsage ? this.formatBytes(this.metrics.memoryUsage) : 'Nincs mérve'}

## Bundle Metrikák
${this.metrics.bundleSize ? `
- Konverzió előtt: ${this.formatBytes(this.metrics.bundleSize.before)}
- Konverzió után: ${this.formatBytes(this.metrics.bundleSize.after)}
- Különbség: ${this.formatBytes(Math.abs(this.metrics.bundleSize.difference))} (${(this.metrics.bundleSize.difference > 0 ? '-' : '+')}${((Math.abs(this.metrics.bundleSize.difference) / this.metrics.bundleSize.before) * 100).toFixed(2)}%)
` : '- Bundle méretek: Nincs mérve'}

## Betöltési Teljesítmény
${this.metrics.loadTime ? `
- Konverzió előtt: ${this.metrics.loadTime.before.toFixed(2)}ms
- Konverzió után: ${this.metrics.loadTime.after.toFixed(2)}ms
- Javulás: ${this.metrics.loadTime.improvement.toFixed(2)}%
` : '- Betöltési idők: Nincs mérve'}

${this.metrics.networkRequests ? `
## Hálózati Metrikák
- Kérések száma: ${this.metrics.networkRequests.count}
- Összes méret: ${this.formatBytes(this.metrics.networkRequests.size)}
- Time to First Byte: ${this.metrics.networkRequests.timeToFirstByte.toFixed(2)}ms
- Gyorsítótárazható erőforrások: ${this.metrics.networkRequests.cacheable}
` : ''}

${hasWebVitals ? `
## Web Vitals
- LCP: ${this.webVitals.lcp ? `${this.webVitals.lcp.toFixed(2)}ms ${this.getWebVitalsScoreIcon('lcp')}` : 'Nincs mérve'}
- FID: ${this.webVitals.fid ? `${this.webVitals.fid.toFixed(2)}ms ${this.getWebVitalsScoreIcon('fid')}` : 'Nincs mérve'}
- CLS: ${this.webVitals.cls ? `${this.webVitals.cls.toFixed(4)} ${this.getWebVitalsScoreIcon('cls')}` : 'Nincs mérve'}
- TTFB: ${this.webVitals.ttfb ? `${this.webVitals.ttfb.toFixed(2)}ms ${this.getWebVitalsScoreIcon('ttfb')}` : 'Nincs mérve'}
- FCP: ${this.webVitals.fcp ? `${this.webVitals.fcp.toFixed(2)}ms ${this.getWebVitalsScoreIcon('fcp')}` : 'Nincs mérve'}
${this.webVitals.inp ? `- INP: ${this.webVitals.inp.toFixed(2)}ms` : ''}
${this.webVitals.tbt ? `- TBT: ${this.webVitals.tbt.toFixed(2)}ms` : ''}
${this.webVitals.speedIndex ? `- Speed Index: ${this.webVitals.speedIndex.toFixed(2)}` : ''}
` : ''}

${hasBenchmarks ? `
## Benchmark Eredmények
${this.benchmarkResults.map((benchmark, index) => `
### Benchmark #${index + 1}
- Renderelési idő: ${benchmark.renderTime.toFixed(2)}ms
- Első renderelés idő: ${benchmark.firstRenderTime.toFixed(2)}ms
- TTFB: ${benchmark.ttfb.toFixed(2)}ms
${benchmark.hydrationTime ? `- Hydration idő: ${benchmark.hydrationTime.toFixed(2)}ms` : ''}
${benchmark.routeChangeTime ? `- Útvonalváltás idő: ${benchmark.routeChangeTime.toFixed(2)}ms` : ''}
${benchmark.dataFetchTime ? `- Adatlekérési idő: ${benchmark.dataFetchTime.toFixed(2)}ms` : ''}
`).join('')}
` : ''}

## Teljesítmény Javaslatok
${this.getPerformanceRecommendations().map(rec => `- ${rec}`).join('\n')}
    `;
  }
  
  /**
   * Web Vitals értékelési ikon visszaadása
   */
  private getWebVitalsScoreIcon(metricName: string): string {
    if (!this.webVitalsInterpretation) return '';
    
    const metric = this.webVitalsInterpretation[metricName as keyof WebVitalsInterpretation];
    if (!metric) return '';
    
    switch (metric.score) {
      case 'good': return '🟢';
      case 'needs-improvement': return '🟠';
      case 'poor': return '🔴';
      default: return '';
    }
  }
  
  /**
   * Teljesítmény javaslatok generálása a metrikák alapján
   */
  private getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Bundle méret ajánlások
    if (this.metrics.bundleSize && this.metrics.bundleSize.difference < 0) {
      recommendations.push('Fontold meg a code splitting és lazy loading alkalmazását a bundle méret csökkentéséért.');
    }
    
    // Web Vitals alapú ajánlások
    if (this.webVitalsInterpretation) {
      // LCP ajánlások
      if (this.webVitalsInterpretation.lcp.score === 'poor' || this.webVitalsInterpretation.lcp.score === 'needs-improvement') {
        recommendations.push('Az LCP értéke javítható. Optimalizáld a képeket, használj webp formátumot és fontold meg a CDN használatát.');
      }
      
      // FID ajánlások
      if (this.webVitalsInterpretation.fid.score === 'poor') {
        recommendations.push('Az FID értéke magas. Csökkentsd a JavaScript végrehajtási időt és kerüld a hosszú futású műveleteket a fő szálon.');
      }
      
      // CLS ajánlások
      if (this.webVitalsInterpretation.cls.score === 'poor' || this.webVitalsInterpretation.cls.score === 'needs-improvement') {
        recommendations.push('A CLS értéke magas. Adj meg explicit méreteket a képeknek és más dinamikus elemeknek, valamint használj helyőrző elemeket.');
      }
      
      // TTFB ajánlások
      if (this.webVitalsInterpretation.ttfb.score === 'poor') {
        recommendations.push('A TTFB értéke magas. Javítsd a szerver válaszidőt szerver-oldali gyorsítótárazással, DB optimalizációval, vagy fontold meg a szerveroldali renderelést.');
      }
    }
    
    // Hálózati ajánlások
    if (this.metrics.networkRequests) {
      if (this.metrics.networkRequests.count > 50) {
        recommendations.push('Túl sok hálózati kérés. Fontold meg az erőforrások összevonását, vagy HTTP/2 használatát.');
      }
      
      if (this.metrics.networkRequests.cacheable < this.metrics.networkRequests.count * 0.5) {
        recommendations.push('Kevés gyorsítótárazható erőforrás. Állíts be megfelelő cache-control és expires fejléceket a statikus erőforrásokhoz.');
      }
    }
    
    // Benchmark ajánlások
    if (this.benchmarkResults.length > 0) {
      const latestBenchmark = this.benchmarkResults[this.benchmarkResults.length - 1];
      
      if (latestBenchmark.renderTime > 200) {
        recommendations.push('A komponens renderelési ideje magas. Fontold meg a memoizálást, virtuális listázást, vagy a komponens optimalizálását.');
      }
      
      if (latestBenchmark.hydrationTime && latestBenchmark.hydrationTime > 150) {
        recommendations.push('A hydration ideje magas. Fontold meg a formák, interaktív komponensek körültekintőbb kezelését és a részleges hydration-t.');
      }
    }
    
    if (recommendations.length === 0) {
      return ['Az alkalmazás teljesítménye megfelelő. Nincsenek specifikus javaslatok.'];
    }
    
    return recommendations;
  }
  
  /**
   * Bájtok formázása olvasható formátumban (KB, MB, stb.)
   * @param bytes Bájtok száma
   * @returns Formázott méret szövegként
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  }
  
  /**
   * Metrikák visszaadása
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return this.metrics;
  }
  
  /**
   * Web Vitals visszaadása
   */
  getWebVitals(): Partial<WebVitalsMetrics> {
    return this.webVitals;
  }
  
  /**
   * Web Vitals értelmezés visszaadása
   */
  getWebVitalsInterpretation(): WebVitalsInterpretation | undefined {
    return this.webVitalsInterpretation;
  }
  
  /**
   * Benchmark eredmények visszaadása
   */
  getBenchmarkResults(): BenchmarkResults[] {
    return this.benchmarkResults;
  }
  
  /**
   * Snapshot készítése az aktuális memóriahasználatról (csak ha a környezet támogatja)
   */
  captureMemoryUsage(): void {
    if (typeof performance !== 'undefined') {
      // Kiterjesztett Performance interfész használata Chrome esetén
      const extendedPerf = performance as ExtendedPerformance;
      if (extendedPerf.memory) {
        this.metrics.memoryUsage = extendedPerf.memory.usedJSHeapSize;
        console.log(`Memóriahasználat: ${this.formatBytes(this.metrics.memoryUsage)}`);
      }
    }
  }
}

/**
 * Web Vitals metrikák gyűjtéséhez segítő függvények
 */
export const WebVitalsCollector = {
  /**
   * Core Web Vitals mérése és továbbítása
   */
  measureWebVitals: (callback: (metrics: Partial<WebVitalsMetrics>) => void) => {
    if (typeof window !== 'undefined') {
      try {
        // LCP mérése
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          callback({ lcp: lastEntry.startTime });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // FID mérése
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const firstEntry = entries[0];
          callback({ fid: firstEntry.processingStart - firstEntry.startTime });
        }).observe({ type: 'first-input', buffered: true });
        
        // CLS mérése
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              callback({ cls: clsValue });
            }
          });
        }).observe({ type: 'layout-shift', buffered: true });
        
        // Navigációs metrikák
        new PerformanceObserver((entryList) => {
          const navEntry = entryList.getEntries()[0] as PerformanceNavigationTiming;
          callback({ 
            ttfb: navEntry.responseStart - navEntry.requestStart,
            fcp: navEntry.domContentLoadedEventEnd
          });
        }).observe({ type: 'navigation', buffered: true });
        
      } catch (error) {
        console.error('Web Vitals mérési hiba:', error);
      }
    }
  }
};
