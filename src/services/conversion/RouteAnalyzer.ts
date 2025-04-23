
import { analyzeNextJsRoutes, convertToReactRoutes, NextJsRoute } from "../routeConverter";
import { ErrorCollector } from "../errors/ErrorCollector";

/**
 * Analyzes and converts Next.js routes to React Router routes
 */
export class RouteAnalyzer {
  private files: File[];
  private errorCollector: ErrorCollector;
  
  constructor(files: File[], errorCollector: ErrorCollector) {
    this.files = files;
    this.errorCollector = errorCollector;
  }
  
  /**
   * Analyze Next.js routes and convert them to React Router format
   */
  async analyzeRoutes(): Promise<{
    nextRoutes: NextJsRoute[];
    routes: any[];
    complexRoutes: NextJsRoute[];
  }> {
    try {
      // Analyze Next.js routes
      const nextRoutes = analyzeNextJsRoutes(this.files);
      
      // Convert to React Router routes
      const reactRoutes = convertToReactRoutes(nextRoutes);
      
      // Identify complex routes that might need special handling
      const complexRoutes = nextRoutes.filter(route => 
        route.path.includes('[...') || 
        route.path.includes('[[...') || 
        (route.params && route.params.length > 1)
      );
      
      // Log warnings for complex routes
      complexRoutes.forEach(route => {
        this.errorCollector.addError({
          code: 'COMPLEX_ROUTE',
          severity: 'warning',
          message: `Complex route pattern detected: ${route.path}`,
          file: route.path, // Use path instead of non-existent filePath
          suggestion: `This route may need manual verification after conversion`
        });
      });
      
      return {
        nextRoutes,
        routes: reactRoutes,
        complexRoutes
      };
    } catch (error) {
      this.errorCollector.addError({
        code: 'ROUTE_ANALYSIS_FAILED',
        severity: 'critical',
        message: `Error analyzing routes: ${error instanceof Error ? error.message : String(error)}`
      });
      
      return {
        nextRoutes: [],
        routes: [],
        complexRoutes: []
      };
    }
  }
  
  /**
   * Generate React Router configuration based on analyzed routes
   */
  generateRouterConfig(routes: any[]): string {
    // Template for React Router configuration
    const routerConfigTemplate = `
import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load components
${routes.map(route => 
  `const ${this.getComponentName(route.component)} = lazy(() => import('${route.componentPath}'));`
).join('\n')}

// Router configuration
const router = createBrowserRouter([
  ${routes.map(route => `{
    path: "${route.path}",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <${this.getComponentName(route.component)} />
      </Suspense>
    ),
  }`).join(',\n  ')}
]);

export default router;
`;

    return routerConfigTemplate;
  }
  
  /**
   * Extract component name from file path
   */
  private getComponentName(componentPath: string): string {
    const parts = componentPath.split('/');
    const fileName = parts[parts.length - 1].replace(/\.\w+$/, '');
    return fileName.charAt(0).toUpperCase() + fileName.slice(1) + 'Page';
  }
}
