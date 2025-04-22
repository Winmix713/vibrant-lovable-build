
import { analyzeDependencies, checkVersionCompatibility, generateInstallCommand } from "../dependencyManager";
import { ErrorCollector } from "../errors/ErrorCollector";

/**
 * Analyzes and manages project dependencies during the conversion process
 */
export class DependencyAnalyzer {
  private packageJson: any;
  private errorCollector: ErrorCollector;
  
  constructor(packageJson: any, errorCollector: ErrorCollector) {
    this.packageJson = packageJson;
    this.errorCollector = errorCollector;
  }
  
  /**
   * Analyze the project dependencies and provide conversion recommendations
   */
  async analyzeDependencies(): Promise<{
    dependencies: any[];
    compatibility: { compatible: boolean; issues: string[] };
    installCommands: string;
  }> {
    try {
      // Analyze the package.json
      const dependencyChanges = analyzeDependencies(this.packageJson);
      
      // Check compatibility
      const compatibility = checkVersionCompatibility(dependencyChanges);
      if (!compatibility.compatible) {
        compatibility.issues.forEach(issue => {
          this.errorCollector.addError({
            code: 'DEP_INCOMPATIBLE',
            severity: 'warning',
            message: issue
          });
        });
      }
      
      // Generate installation commands
      const installCommands = generateInstallCommand(dependencyChanges);
      
      return {
        dependencies: dependencyChanges,
        compatibility,
        installCommands
      };
    } catch (error) {
      this.errorCollector.addError({
        code: 'DEP_ANALYSIS_FAILED',
        severity: 'critical',
        message: `Error during dependency analysis: ${error instanceof Error ? error.message : String(error)}`
      });
      
      return {
        dependencies: [],
        compatibility: { compatible: false, issues: ['Dependency analysis failed'] },
        installCommands: ''
      };
    }
  }
  
  /**
   * Generate optimized package.json for the converted project
   */
  generateOptimizedPackageJson(): any {
    const dependencies = this.packageJson.dependencies || {};
    const devDependencies = this.packageJson.devDependencies || {};
    
    // Create a new package.json with updated dependencies
    const optimizedPackageJson = {
      ...this.packageJson,
      dependencies: { ...dependencies },
      devDependencies: { ...devDependencies }
    };
    
    try {
      // Remove Next.js specific dependencies
      delete optimizedPackageJson.dependencies['next'];
      
      // Add Vite and React Router dependencies
      optimizedPackageJson.devDependencies['vite'] = '^4.4.0';
      optimizedPackageJson.devDependencies['@vitejs/plugin-react'] = '^4.0.0';
      optimizedPackageJson.dependencies['react-router-dom'] = '^6.14.0';
      
      // Replace Next.js image with alternatives
      if (dependencies['next-images'] || dependencies['next/image']) {
        delete optimizedPackageJson.dependencies['next-images'];
        optimizedPackageJson.dependencies['@unpic/react'] = '^0.0.30';
      }
      
      // Add React Query if data fetching transformation is needed
      if (this.hasServerSideDataFetching()) {
        optimizedPackageJson.dependencies['@tanstack/react-query'] = '^4.29.15';
      }
      
      return optimizedPackageJson;
    } catch (error) {
      this.errorCollector.addError({
        code: 'PKG_OPTIMIZATION_FAILED',
        severity: 'warning',
        message: `Package.json optimization failed: ${error instanceof Error ? error.message : String(error)}`
      });
      return this.packageJson;
    }
  }
  
  /**
   * Check if the project uses server-side data fetching
   */
  private hasServerSideDataFetching(): boolean {
    // This would need access to the project files to properly check
    // For now, we'll assume true as it's common in Next.js projects
    return true;
  }
}
