
import { analyzeNextJsRoutes } from './routeConverter';
import { analyzeDependencies, checkVersionCompatibility } from './dependencyManager';
import { transformCode, getTransformationStats } from './codeTransformer';
import { analyzeMiddlewareFiles, transformMiddleware } from './middlewareTransformer';
import { analyzeCodeStructure } from './astTransformer';
import { ConversionOptions } from '@/types/conversion';
import { PerformanceMonitor } from './performanceMonitor';
import { DiagnosticsReporter } from './diagnosticsReporter';

/**
 * Rendszerszintű optimalizáló és elemző
 * Ez az osztály felelős a teljes konverziós rendszer átfogó elemzéséért és optimalizálásáért
 */
export class SystemOptimizerAnalyzer {
  private files: File[];
  private packageJson: any;
  private options: ConversionOptions;
  private performanceMonitor: PerformanceMonitor;
  private diagnosticsReporter: DiagnosticsReporter;
  
  constructor(files: File[], packageJson: any, options: ConversionOptions) {
    this.files = files;
    this.packageJson = packageJson;
    this.options = options;
    this.performanceMonitor = new PerformanceMonitor({ debugMode: true });
    this.diagnosticsReporter = new DiagnosticsReporter('Project Analysis', options);
  }
  
  /**
   * Rendszerszintű elemzés és optimalizálás futtatása
   */
  async runSystemAnalysis(): Promise<{
    diagnostics: any,
    performance: any,
    suggestions: string[],
    issues: string[],
    optimizations: string[]
  }> {
    this.performanceMonitor.startMeasurement();
    
    console.log('Rendszerszintű elemzés és optimalizálás elindítása...');
    
    try {
      // 1. Projekt kódbázis átfogó elemzése
      const codebaseAnalysis = await this.analyzeCodebase();
      
      // 2. Függőségek elemzése
      const dependencyAnalysis = this.analyzeDependencies();
      
      // 3. Útvonalak elemzése
      const routingAnalysis = this.analyzeRouting();
      
      // 4. Middleware elemzés
      const middlewareAnalysis = this.analyzeMiddleware();
      
      // 5. TypeScript típusok elemzése
      const typescriptAnalysis = this.analyzeTypescript();
      
      // 6. API útvonalak elemzése
      const apiAnalysis = this.analyzeApiRoutes();
      
      // 7. Teljesítmény metrikák gyűjtése
      this.performanceMonitor.captureMemoryUsage();
      
      // 8. Konverziós teljesség felmérése
      const completenessAnalysis = this.analyzeCompleteness();
      
      // 9. Optimalizációs lehetőségek azonosítása
      const optimizationOpportunities = this.identifyOptimizationOpportunities(
        codebaseAnalysis,
        dependencyAnalysis,
        routingAnalysis,
        middlewareAnalysis,
        typescriptAnalysis,
        apiAnalysis,
        completenessAnalysis
      );
      
      // Rendszerszintű elemzés befejezése
      this.performanceMonitor.endMeasurement();
      
      // Összesített eredmények visszaadása
      return {
        diagnostics: this.diagnosticsReporter.generateReport(),
        performance: this.performanceMonitor.getMetrics(),
        suggestions: optimizationOpportunities.suggestions,
        issues: optimizationOpportunities.issues,
        optimizations: optimizationOpportunities.optimizations
      };
      
    } catch (error) {
      console.error('Rendszerszintű elemzés hiba:', error);
      this.diagnosticsReporter.addError('system', `Rendszerszintű elemzés közben hiba történt: ${error instanceof Error ? error.message : String(error)}`);
      this.performanceMonitor.endMeasurement();
      
      return {
        diagnostics: this.diagnosticsReporter.generateReport(),
        performance: this.performanceMonitor.getMetrics(),
        suggestions: ['Hibakeresés futtatása javasolt a konverziós rendszerben.'],
        issues: [`Rendszerszintű hiba: ${error instanceof Error ? error.message : String(error)}`],
        optimizations: []
      };
    }
  }
  
  /**
   * Kódbázis átfogó elemzése
   */
  private async analyzeCodebase(): Promise<{
    totalFiles: number;
    jsFiles: number;
    tsFiles: number;
    reactComponents: number;
    hooks: number;
    cssFiles: number;
    apiRoutes: number;
    nextjsFeatureUsage: Record<string, number>;
  }> {
    console.log('Kódbázis elemzése...');
    
    let reactComponents = 0;
    let hooks = 0;
    let apiRoutes = 0;
    let jsFiles = 0;
    let tsFiles = 0;
    let cssFiles = 0;
    const nextjsFeatureUsage: Record<string, number> = {
      'next/image': 0,
      'next/link': 0,
      'next/head': 0,
      'next/router': 0,
      'getServerSideProps': 0,
      'getStaticProps': 0,
      'getStaticPaths': 0,
      'NextApiRequest': 0,
      'NextApiResponse': 0,
      'middleware': 0
    };
    
    // Fájlok elemzése
    for (const file of this.files) {
      try {
        const fileName = file.name.toLowerCase();
        
        // Fájltípusok számolása
        if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
          jsFiles++;
        } else if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
          tsFiles++;
        } else if (fileName.endsWith('.css') || fileName.endsWith('.scss') || fileName.endsWith('.sass')) {
          cssFiles++;
        }
        
        // API útvonalak száma
        if (fileName.includes('/api/') && (fileName.endsWith('.js') || fileName.endsWith('.ts'))) {
          apiRoutes++;
        }
        
        // Fájl tartalom elemzése
        const content = await this.readFileContent(file);
        
        // Next.js funkciók használatának detektálása
        Object.keys(nextjsFeatureUsage).forEach(feature => {
          if (content.includes(feature)) {
            nextjsFeatureUsage[feature]++;
          }
        });
        
        // React komponensek és hook-ok detektálása
        if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
          try {
            const analysis = analyzeCodeStructure(content);
            reactComponents += analysis.components.length;
            hooks += analysis.hooks.length;
          } catch (error) {
            console.error(`Hiba a ${fileName} fájl elemzése közben:`, error);
          }
        }
        
      } catch (error) {
        console.error(`Hiba a ${file.name} fájl elemzése közben:`, error);
      }
    }
    
    // Elemzési eredmények összeállítása
    const analysis = {
      totalFiles: this.files.length,
      jsFiles,
      tsFiles,
      reactComponents,
      hooks,
      cssFiles,
      apiRoutes,
      nextjsFeatureUsage
    };
    
    // Diagnosztikai bejegyzések hozzáadása
    this.diagnosticsReporter.addInfo('analyzer', `Kódbázis elemzés befejezve: ${analysis.totalFiles} fájl`);
    this.diagnosticsReporter.addInfo('component', `React komponensek száma: ${analysis.reactComponents}`);
    this.diagnosticsReporter.addInfo('routing', `API útvonalak száma: ${analysis.apiRoutes}`);
    
    // Next.js funkciók használata alapján diagnosztikák
    Object.entries(nextjsFeatureUsage).forEach(([feature, count]) => {
      if (count > 0) {
        this.diagnosticsReporter.addInfo('feature-usage', `${feature} használat: ${count} helyen`, {
          context: { feature, count }
        });
      }
    });
    
    return analysis;
  }
  
  /**
   * Függőségek elemzése
   */
  private analyzeDependencies(): { 
    dependencies: any[], 
    compatibility: { compatible: boolean, issues: string[] }
  } {
    console.log('Függőségek elemzése...');
    
    // Függőségek elemzése
    const dependencies = analyzeDependencies(this.packageJson);
    
    // Kompatibilitás ellenőrzése
    const compatibility = checkVersionCompatibility(dependencies);
    
    // Diagnosztikai bejegyzések
    if (!compatibility.compatible) {
      compatibility.issues.forEach(issue => {
        this.diagnosticsReporter.addWarning('dependency', issue);
      });
    }
    
    this.diagnosticsReporter.addInfo('dependency', `Függőségek elemzése befejezve: ${dependencies.length} függőség vizsgálva`);
    
    return {
      dependencies,
      compatibility
    };
  }
  
  /**
   * Útvonalak elemzése
   */
  private analyzeRouting(): {
    routes: any[];
    dynamicRoutes: number;
    complexRoutes: number;
  } {
    console.log('Útvonalak elemzése...');
    
    // Next.js útvonalak elemzése
    const nextRoutes = analyzeNextJsRoutes(this.files as any);
    
    // Dinamikus útvonalak számolása
    const dynamicRoutes = nextRoutes.filter(route => route.isDynamic).length;
    
    // Komplex útvonalak (catch-all, opcionális paraméterek) számolása
    const complexRoutes = nextRoutes.filter(route => 
      route.path.includes('[...') || 
      route.path.includes('[[...') || 
      (route.isDynamic && route.path.split('/').filter(part => part.includes('[')).length > 1)
    ).length;
    
    // Diagnosztikai bejegyzések
    this.diagnosticsReporter.addInfo('routing', `Útvonalak elemzése befejezve: ${nextRoutes.length} útvonal, ${dynamicRoutes} dinamikus`);
    
    if (complexRoutes > 0) {
      this.diagnosticsReporter.addWarning('routing', `${complexRoutes} komplex útvonal található, amelyek extra figyelmet igényelhetnek a konverzió során.`);
    }
    
    return {
      routes: nextRoutes,
      dynamicRoutes,
      complexRoutes
    };
  }
  
  /**
   * Middleware elemzése
   */
  private async analyzeMiddleware(): Promise<{
    middlewares: any[];
    complexMiddlewares: number;
  }> {
    console.log('Middleware elemzése...');
    
    // Middleware fájlok keresése és elemzése
    const filesWithContent = await Promise.all(this.files.map(async file => ({
      name: file.name,
      content: await this.readFileContent(file)
    })));
    
    const middlewares = analyzeMiddlewareFiles(filesWithContent);
    
    // Komplex middleware-ek számolása (edge runtime, speciális konfigurációk)
    const complexMiddlewares = middlewares.filter(middleware => 
      middleware.type === 'edge' || middleware.matcher !== undefined
    ).length;
    
    // Diagnosztikai bejegyzések
    this.diagnosticsReporter.addInfo('middleware', `Middleware elemzése befejezve: ${middlewares.length} middleware`);
    
    if (complexMiddlewares > 0) {
      this.diagnosticsReporter.addWarning('middleware', `${complexMiddlewares} komplex middleware található, amelyek extra figyelmet igényelhetnek a konverzió során.`);
    }
    
    return {
      middlewares,
      complexMiddlewares
    };
  }
  
  /**
   * TypeScript típusok elemzése
   */
  private async analyzeTypescript(): Promise<{
    nextTypesCount: number;
    customTypes: number;
  }> {
    console.log('TypeScript típusok elemzése...');
    
    let nextTypesCount = 0;
    let customTypes = 0;
    
    // TypeScript fájlok keresése és elemzése
    for (const file of this.files) {
      if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        try {
          const content = await this.readFileContent(file);
          
          // Next.js típusok használatának detektálása
          const nextTypeMatches = content.match(/Next(?:Page|Api\w+|Config|Router|App\w+)/g);
          if (nextTypeMatches) {
            nextTypesCount += nextTypeMatches.length;
          }
          
          // Egyéni típusok és interfészek számolása
          const typeMatches = content.match(/(?:type|interface)\s+\w+/g);
          if (typeMatches) {
            customTypes += typeMatches.length;
          }
        } catch (error) {
          console.error(`Hiba a ${file.name} fájl típusainak elemzése közben:`, error);
        }
      }
    }
    
    // Diagnosztikai bejegyzések
    this.diagnosticsReporter.addInfo('typescript', `TypeScript típusok elemzése befejezve: ${nextTypesCount} Next.js típus, ${customTypes} egyéni típus`);
    
    if (nextTypesCount > 0) {
      this.diagnosticsReporter.addWarning('typescript', `${nextTypesCount} Next.js-specifikus típus található, amelyeket át kell alakítani.`);
    }
    
    return {
      nextTypesCount,
      customTypes
    };
  }
  
  /**
   * API útvonalak elemzése
   */
  private async analyzeApiRoutes(): Promise<{
    apiFiles: number;
    apiEndpoints: number;
    dynamicApiEndpoints: number;
  }> {
    console.log('API útvonalak elemzése...');
    
    let apiFiles = 0;
    let apiEndpoints = 0;
    let dynamicApiEndpoints = 0;
    
    // API fájlok keresése
    for (const file of this.files) {
      const fileName = file.name;
      
      if ((fileName.includes('/api/') || fileName.includes('\\api\\')) && 
          (fileName.endsWith('.js') || fileName.endsWith('.ts'))) {
        apiFiles++;
        
        // API végpontok számolása
        apiEndpoints++;
        
        // Dinamikus API végpontok számolása
        if (fileName.includes('[') && fileName.includes(']')) {
          dynamicApiEndpoints++;
        }
      }
    }
    
    // Diagnosztikai bejegyzések
    this.diagnosticsReporter.addInfo('api', `API útvonalak elemzése befejezve: ${apiEndpoints} végpont, ${dynamicApiEndpoints} dinamikus`);
    
    if (dynamicApiEndpoints > 0) {
      this.diagnosticsReporter.addWarning('api', `${dynamicApiEndpoints} dinamikus API végpont található, ezeket Express/Fastify route kezelőkké kell alakítani.`);
    }
    
    return {
      apiFiles,
      apiEndpoints,
      dynamicApiEndpoints
    };
  }
  
  /**
   * A konverzió teljességének felmérése
   */
  private analyzeCompleteness(): {
    convertiblePercentage: number;
    challengingAreas: string[];
    automationLevel: 'high' | 'medium' | 'low';
  } {
    console.log('Konverziós teljesség felmérése...');
    
    // Konverzió teljességének indikátora (0-100%)
    let convertiblePercentage = 85; // Alapértelmezett érték
    
    // Kihívást jelentő területek
    const challengingAreas: string[] = [];
    
    // A korábbi elemzések értékelése (például: middleware, API, stb.)
    if (!this.options.useReactRouter) {
      convertiblePercentage -= 15;
      challengingAreas.push('Útvonalkezelés');
    }
    
    if (!this.options.convertApiRoutes) {
      convertiblePercentage -= 10;
      challengingAreas.push('API útvonalak');
    }
    
    if (!this.options.transformDataFetching) {
      convertiblePercentage -= 20;
      challengingAreas.push('Adatlekérés');
    }
    
    if (!this.options.replaceComponents) {
      convertiblePercentage -= 15;
      challengingAreas.push('Next.js komponensek');
    }
    
    if (!this.options.handleMiddleware) {
      convertiblePercentage -= 10;
      challengingAreas.push('Middleware kezelés');
    }
    
    // A diagnózis hozzáadása
    this.diagnosticsReporter.addInfo('completeness', `Konverziós teljesség: körülbelül ${convertiblePercentage}%`);
    
    if (challengingAreas.length > 0) {
      this.diagnosticsReporter.addInfo('completeness', `Kihívást jelentő területek: ${challengingAreas.join(', ')}`);
    }
    
    // Automatizálási szint meghatározása
    let automationLevel: 'high' | 'medium' | 'low' = 'high';
    
    if (convertiblePercentage < 70) {
      automationLevel = 'low';
    } else if (convertiblePercentage < 85) {
      automationLevel = 'medium';
    }
    
    return {
      convertiblePercentage,
      challengingAreas,
      automationLevel
    };
  }
  
  /**
   * Optimalizációs lehetőségek azonosítása
   */
  private identifyOptimizationOpportunities(
    codebaseAnalysis: any,
    dependencyAnalysis: any,
    routingAnalysis: any,
    middlewareAnalysis: any,
    typescriptAnalysis: any,
    apiAnalysis: any,
    completenessAnalysis: any
  ): {
    suggestions: string[];
    issues: string[];
    optimizations: string[];
  } {
    console.log('Optimalizációs lehetőségek azonosítása...');
    
    const suggestions: string[] = [];
    const issues: string[] = [];
    const optimizations: string[] = [];
    
    // Függőségi problémák
    if (!dependencyAnalysis.compatibility.compatible) {
      issues.push('Függőségi inkompatibilitás: Nem minden Next.js függőség konvertálható automatikusan.');
      suggestions.push('Javasolt a problémás függőségek alternatívákra cserélése (pl. next/router → react-router-dom).');
    }
    
    // Komplex útvonalak
    if (routingAnalysis.complexRoutes > 0) {
      issues.push(`${routingAnalysis.complexRoutes} komplex útvonal (catch-all, nested) található, ezek manuális figyelmet igényelnek.`);
      suggestions.push('Javasolt a React Router használata egyedi paraméterkezeléssel.');
    }
    
    // Middleware problémák
    if (middlewareAnalysis.complexMiddlewares > 0) {
      issues.push(`${middlewareAnalysis.complexMiddlewares} komplex middleware található (Edge runtime, custom matcher).`);
      suggestions.push('Az Edge middleware-eket alakítsd át Express/Fastify middleware-ekké vagy React hook-okká.');
    }
    
    // API útvonal problémák
    if (apiAnalysis.dynamicApiEndpoints > 0) {
      issues.push(`${apiAnalysis.dynamicApiEndpoints} dinamikus API végpont található.`);
      suggestions.push('Dinamikus API végpontokat Express/Fastify útvonalakká kell alakítani paraméterekkel.');
    }
    
    // TypeScript problémák
    if (typescriptAnalysis.nextTypesCount > 0) {
      issues.push(`${typescriptAnalysis.nextTypesCount} Next.js-specifikus típus található a kódban.`);
      suggestions.push('Next.js típusokat alakítsd át React, React Router és Express típusokká.');
    }
    
    // Automatizációs lehetőségek
    if (completenessAnalysis.automationLevel === 'high') {
      optimizations.push('A projekt magasfokú automatikus konverzióra alkalmas.');
    } else if (completenessAnalysis.automationLevel === 'medium') {
      optimizations.push('A projekt részleges automatikus konverzióra alkalmas, néhány manuális beavatkozással.');
    } else {
      optimizations.push('A projekt alacsony fokú automatikus konverzióra alkalmas, jelentős manuális munkát igényel.');
    }
    
    // Kódbázis optimalizálások
    optimizations.push('A komponensek lazy-loading technikával optimalizálhatók a bundle méret csökkentéséhez.');
    optimizations.push('React Query bevezetése javasolt a szerveroldali adatlekérések helyettesítésére.');
    
    if (codebaseAnalysis.reactComponents > 20) {
      optimizations.push('Javasolt komponenskönyvtár kialakítása az újrafelhasználható elemekhez.');
    }
    
    return {
      suggestions,
      issues,
      optimizations
    };
  }
  
  /**
   * Fájl tartalom olvasása
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("Fájl olvasási hiba"));
      reader.readAsText(file);
    });
  }
}

/**
 * Konverziós rendszer validálása
 */
export async function validateConversionSystem(): Promise<{
  valid: boolean;
  issues: string[];
  components: { name: string; status: 'ok' | 'warning' | 'error'; message?: string }[];
}> {
  console.log('Konverziós rendszer validálása...');
  
  const components = [
    { name: 'routeConverter', status: 'ok' as const },
    { name: 'codeTransformer', status: 'ok' as const },
    { name: 'astTransformer', status: 'ok' as const },
    { name: 'middlewareTransformer', status: 'ok' as const },
    { name: 'apiRouteTransformer', status: 'ok' as const },
    { name: 'dependencyManager', status: 'ok' as const },
    { name: 'performanceMonitor', status: 'ok' as const },
    { name: 'diagnosticsReporter', status: 'ok' as const }
  ];
  
  const issues: string[] = [];
  
  // Komponensek ellenőrzése
  try {
    // RouteConverter ellenőrzése
    const routeConverterValid = typeof analyzeNextJsRoutes === 'function';
    if (!routeConverterValid) {
      components[0].status = 'error';
      components[0].message = 'A routeConverter komponens nem elérhető vagy hibás.';
      issues.push('RouteConverter validálási hiba');
    }
    
    // CodeTransformer ellenőrzése
    const codeTransformerValid = typeof transformCode === 'function';
    if (!codeTransformerValid) {
      components[1].status = 'error';
      components[1].message = 'A codeTransformer komponens nem elérhető vagy hibás.';
      issues.push('CodeTransformer validálási hiba');
    }
    
    // AstTransformer ellenőrzése
    const astTransformerValid = typeof analyzeCodeStructure === 'function';
    if (!astTransformerValid) {
      components[2].status = 'error';
      components[2].message = 'Az astTransformer komponens nem elérhető vagy hibás.';
      issues.push('AstTransformer validálási hiba');
    }
    
    // MiddlewareTransformer ellenőrzése
    const middlewareTransformerValid = typeof transformMiddleware === 'function';
    if (!middlewareTransformerValid) {
      components[3].status = 'error';
      components[3].message = 'A middlewareTransformer komponens nem elérhető vagy hibás.';
      issues.push('MiddlewareTransformer validálási hiba');
    }
    
  } catch (error) {
    issues.push(`Rendszervalidálási hiba: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Rendszerállapot értékelése
  const valid = issues.length === 0;
  
  return {
    valid,
    issues,
    components
  };
}
