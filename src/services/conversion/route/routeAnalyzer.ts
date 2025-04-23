
import { ErrorCollector } from "../../errors/ErrorCollector";
import { NextJsRoute } from "../../routeConverter";

/**
 * Analyze routes from project files
 */
export async function analyzeRoutes(files: File[], errorCollector: ErrorCollector): Promise<{
  routes: any[];
}> {
  try {
    // Basic route analysis implementation
    const routes: any[] = [];
    
    // Extract routes from files
    for (const file of files) {
      const fileName = file.name;
      
      // Check if this is a pages file
      if (fileName.includes('/pages/') && 
         (fileName.endsWith('.js') || fileName.endsWith('.jsx') || 
          fileName.endsWith('.ts') || fileName.endsWith('.tsx'))) {
        
        // Skip API routes
        if (fileName.includes('/api/')) continue;
        
        // Convert Next.js path to route
        const route = convertFilePathToRoute(fileName);
        if (route) {
          routes.push(route);
        }
      }
    }
    
    return { routes };
  } catch (error) {
    errorCollector.addError({
      code: 'ROUTE_ANALYSIS_ERROR',
      severity: 'warning',
      message: `Error analyzing routes: ${error instanceof Error ? error.message : String(error)}`
    });
    
    return { routes: [] };
  }
}

/**
 * Convert a file path to a route object
 */
function convertFilePathToRoute(filePath: string): any | null {
  try {
    // Extract route path from filePath
    const parts = filePath.split('/pages/');
    if (parts.length < 2) return null;
    
    let routePath = parts[1]
      .replace(/\.(js|jsx|ts|tsx)$/, '')
      .replace(/\/index$/, '/');
    
    // Handle dynamic routes
    routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
    
    // Remove trailing slash if not the index route
    if (routePath !== '/') {
      routePath = routePath.replace(/\/$/, '');
    }
    
    return {
      path: routePath,
      componentPath: filePath,
      component: parts[1].split('/').pop()?.replace(/\.(js|jsx|ts|tsx)$/, '') || 'Unknown'
    };
  } catch (error) {
    console.error('Error converting file path to route:', error);
    return null;
  }
}
