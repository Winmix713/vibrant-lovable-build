
import { analyzeNextJsRoutes, convertToReactRoutes, NextJsRoute } from "./routeConverter";
import { analyzeDependencies, generatePackageJsonUpdates, checkVersionCompatibility, generateInstallCommand } from "./dependencyManager";
import { transformCode, getTransformationStats } from "./codeTransformer";
import { ConversionOptions } from "@/types/conversion";
import { generateCICDTemplates } from "./cicdGenerator";
import { detectMiddlewareType, transformMiddleware } from "./middlewareTransformer";

interface ConversionResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  routes: any[];
  dependencies: any[];
  transformedFiles: string[];
  stats: {
    totalFiles: number;
    modifiedFiles: number;
    transformationRate: number;
    dependencyChanges: number;
    routeChanges: number;
  };
}

export class ConversionExecutor {
  private options: ConversionOptions;
  private files: File[];
  private projectJson: any;
  private result: ConversionResult;
  private progress: number = 0;
  private progressCallback?: (progress: number, message: string) => void;

  constructor(files: File[], packageJson: any, options: ConversionOptions) {
    this.files = files;
    this.projectJson = packageJson;
    this.options = options;
    this.result = {
      success: false,
      errors: [],
      warnings: [],
      info: [],
      routes: [],
      dependencies: [],
      transformedFiles: [],
      stats: {
        totalFiles: files.length,
        modifiedFiles: 0,
        transformationRate: 0,
        dependencyChanges: 0,
        routeChanges: 0
      }
    };
  }
  
  setProgressCallback(callback: (progress: number, message: string) => void) {
    this.progressCallback = callback;
    return this;
  }
  
  private updateProgress(increment: number, message: string) {
    this.progress += increment;
    if (this.progressCallback) {
      this.progressCallback(this.progress, message);
    }
  }
  
  async execute(): Promise<ConversionResult> {
    try {
      this.updateProgress(5, "Kezdés: projekt elemzése...");
      
      // 1. Függőségek elemzése
      if (this.options.updateDependencies) {
        await this.analyzeDependencies();
      }
      
      // 2. Útvonalak elemzése
      if (this.options.useReactRouter) {
        await this.analyzeRoutes();
      }
      
      // 3. Fájlok transzformálása
      await this.transformFiles();
      
      // 4. API útvonalak konvertálása
      if (this.options.convertApiRoutes) {
        await this.convertApiRoutes();
      }
      
      // 5. Komponensek helyettesítése
      if (this.options.replaceComponents) {
        await this.replaceComponents();
      }

      // 6. Middleware kezelése
      if (this.options.handleMiddleware) {
        await this.handleMiddlewares();
      }
      
      // 7. CI/CD konfigurációk generálása
      await this.generateCICDFiles();
      
      this.updateProgress(100, "Konverzió befejezve!");
      this.result.success = this.result.errors.length === 0;
      
      return this.result;
      
    } catch (error) {
      this.result.success = false;
      this.result.errors.push(`Váratlan hiba: ${error instanceof Error ? error.message : String(error)}`);
      return this.result;
    }
  }
  
  private async analyzeDependencies(): Promise<void> {
    this.updateProgress(10, "Függőségek elemzése...");
    
    try {
      // A package.json elemzése
      const dependencyChanges = analyzeDependencies(this.projectJson);
      this.result.dependencies = dependencyChanges;
      this.result.stats.dependencyChanges = dependencyChanges.length;
      
      // Kompatibilitás ellenőrzése
      const compatibility = checkVersionCompatibility(dependencyChanges);
      if (!compatibility.compatible) {
        compatibility.issues.forEach(issue => {
          this.result.warnings.push(issue);
        });
      }
      
      // Telepítési parancsok generálása
      const installCommands = generateInstallCommand(dependencyChanges);
      this.result.info.push("Telepítési parancsok:\n" + installCommands);
      
    } catch (error) {
      this.result.errors.push(`Hiba a függőségek elemzése közben: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private async analyzeRoutes(): Promise<void> {
    this.updateProgress(20, "Útvonalak elemzése...");
    
    try {
      // Routes elemzése
      const nextRoutes: NextJsRoute[] = analyzeNextJsRoutes(this.files);
      const reactRoutes = convertToReactRoutes(nextRoutes);
      
      this.result.routes = reactRoutes;
      this.result.stats.routeChanges = reactRoutes.length;
      
    } catch (error) {
      this.result.errors.push(`Hiba az útvonalak elemzése közben: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private async transformFiles(): Promise<void> {
    this.updateProgress(30, "Fájlok transzformálása...");
    
    let modifiedFiles = 0;
    const progressStep = 40 / Math.max(1, this.files.length); // 30-70% között
    
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      
      try {
        // Fájl tartalom kinyerése
        const content = await this.readFileContent(file);
        
        // Kihagyása, ha nem kódot tartalmaz
        if (this.shouldSkipFile(file.name)) {
          this.updateProgress(progressStep, `Kihagyva: ${file.name}`);
          continue;
        }
        
        // Kód transzformáció
        const { transformedCode, appliedTransformations } = transformCode(content);
        
        // Csak akkor számít módosítottnak, ha tényleg volt változás
        if (transformedCode !== content && appliedTransformations.length > 0) {
          this.result.transformedFiles.push(file.name);
          modifiedFiles++;
          
          // Részletes információ hozzáadása
          this.result.info.push(`Transzformációk a következő fájlban: ${file.name}\n` +
            appliedTransformations.map(t => `  - ${t}`).join('\n'));
        }
        
      } catch (error) {
        this.result.warnings.push(`Hiba a(z) ${file.name} transzformálása közben: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      this.updateProgress(progressStep, `Feldolgozva: ${file.name}`);
    }
    
    // Statisztikák frissítése
    this.result.stats.modifiedFiles = modifiedFiles;
    this.result.stats.transformationRate = modifiedFiles / this.files.length;
  }
  
  private async convertApiRoutes(): Promise<void> {
    this.updateProgress(75, "API útvonalak konvertálása...");
    
    // Itt implementálnánk az API útvonalak részletes konvertálását
    // Ez a funkció jelenleg csak helyőrző, de később kibővíthető
    
    const apiRouteFiles = this.files.filter(file => 
      file.name.includes('/api/') || file.name.includes('pages/api/')
    );
    
    if (apiRouteFiles.length > 0) {
      this.result.info.push(`${apiRouteFiles.length} API útvonal azonosítva konverzióra`);
    } else {
      this.result.info.push("Nem találhatók API útvonalak");
    }
  }
  
  private async replaceComponents(): Promise<void> {
    this.updateProgress(85, "Next.js komponensek helyettesítése...");
    
    // Itt implementálnánk a Next.js specifikus komponensek cseréjét
    // Ez a funkció jelenleg csak helyőrző
    
    this.result.info.push("Komponensek helyettesítése befejezve");
  }

  private async handleMiddlewares(): Promise<void> {
    this.updateProgress(80, "Middleware-ek konvertálása...");
    
    const middlewareFiles = this.files.filter(file => 
      file.name.includes('middleware.ts') || 
      file.name.includes('middleware.js')
    );
    
    for (const file of middlewareFiles) {
      try {
        const content = await this.readFileContent(file);
        const type = detectMiddlewareType(content);
        const transformed = transformMiddleware(content, type);
        
        this.result.info.push(`Middleware átalakítva: ${file.name}`);
        this.result.transformedFiles.push(file.name);
        
      } catch (error) {
        this.result.warnings.push(
          `Hiba a middleware konvertálása közben: ${file.name}`
        );
      }
    }
  }

  private async generateCICDFiles(): Promise<void> {
    this.updateProgress(90, "CI/CD konfigurációk generálása...");
    
    try {
      const templates = generateCICDTemplates();
      
      for (const [platform, template] of Object.entries(templates)) {
        this.result.info.push(
          `${platform} konfiguráció generálva: ${template.filename}`
        );
      }
      
    } catch (error) {
      this.result.warnings.push(
        `Hiba a CI/CD konfigurációk generálása közben`
      );
    }
  }
  
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("Fájl olvasási hiba"));
      reader.readAsText(file);
    });
  }
  
  private shouldSkipFile(fileName: string): boolean {
    // Kihagyandó fájlok: képek, videók, stb.
    const skipExtensions = ['.jpg', '.png', '.gif', '.svg', '.mp4', '.mp3', '.pdf', '.ico'];
    return skipExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }
  
  // Fejlett/extra funkciók lehetnek itt, pl.:
  
  generateReport(): string {
    // HTML formátumú jelentés generálása
    return `
      <html>
        <head><title>Next.js to Vite Conversion Report</title></head>
        <body>
          <h1>Conversion Report</h1>
          <h2>Summary</h2>
          <p>Total Files: ${this.result.stats.totalFiles}</p>
          <p>Modified Files: ${this.result.stats.modifiedFiles}</p>
          <p>Transformation Rate: ${Math.round(this.result.stats.transformationRate * 100)}%</p>
          
          <h2>Issues</h2>
          <h3>Errors (${this.result.errors.length})</h3>
          <ul>${this.result.errors.map(e => `<li>${e}</li>`).join('')}</ul>
          
          <h3>Warnings (${this.result.warnings.length})</h3>
          <ul>${this.result.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
          
          <!-- További részletek itt -->
        </body>
      </html>
    `;
  }
}
