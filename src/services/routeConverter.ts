import { RouteObject } from "react-router-dom";
import { NextJsRoute, RouteConversionResult, ReactRouterRoute } from "./conversion/route/types";

export type { NextJsRoute }; // export type to fix isolatedModules issue

export function analyzeNextJsRoutes(
  files: string[] | File[]
): NextJsRoute[] {
  const routes: NextJsRoute[] = [];
  
  // Safely convert File[] to string[] if needed
  const filePaths = files.map(file => typeof file === 'string' ? file : file.name);
  
  filePaths
    .filter(file => file.includes('/pages/') && 
      !file.includes('/_app.') && !file.includes('/_document.'))
    .forEach(file => {
      const route = createRouteFromFilePath(file);
      if (route) {
        routes.push(route);
      }
    });
  
  return routes;
}

export function convertToReactRoutes(
  nextRoutes: NextJsRoute[]
): ReactRouterRoute[] {
  return nextRoutes.map(route => {
    let path = route.path;
    
    // Convert dynamic segments
    if (route.isDynamic) {
      if (route.isOptionalCatchAll) {
        // Convert [[...param]] to * (optional catch-all)
        path = path.replace(/\/\[\[\.\.\.([^\]]+)\]\]/g, '/*');
      } else if (route.isCatchAll) {
        // Convert [...param] to * (catch-all)
        path = path.replace(/\/\[\.\.\.([^\]]+)\]/g, '/*');
      } else {
        // Convert [param] to :param
        path = path.replace(/\/\[([^\]]+)\]/g, '/:$1');
      }
    }
    
    // Ensure path isn't undefined and create proper ReactRouterRoute
    return {
      path: path || '/',
      element: `<Component path="${route.component}" />`,
      // add any other required properties for ReactRouterRoute
    } as ReactRouterRoute;
  });
}

export function convertNextJsRoutes(
  files: string[] | File[]
): RouteConversionResult {
  const result: RouteConversionResult = {
    nextRoutes: [],
    reactRouterRoutes: [],
    warnings: [],
    originalPath: '/pages',
    code: ''
  };
  
  // Analyze Next.js routes
  const nextRoutes = analyzeNextJsRoutes(files);
  result.nextRoutes = nextRoutes;
  
  // Convert to React Router routes
  const reactRouterRoutes = convertToReactRoutes(nextRoutes);
  result.reactRouterRoutes = reactRouterRoutes;
  
  // Generate code
  result.code = generateRouterCode(reactRouterRoutes);
  
  return result;
}

function createRouteFromFilePath(filePath: string): NextJsRoute | null {
  // Extract relevant path parts
  const pathMatch = filePath.match(/\/pages\/(.+?)\.(js|jsx|ts|tsx)$/);
  if (!pathMatch) return null;
  
  const pagePath = pathMatch[1];
  const isDynamic = pagePath.includes('[');
  const isIndex = pagePath.endsWith('/index') || pagePath === 'index';
  let path = `/${pagePath}`;
  
  // Clean up the path
  if (isIndex) {
    path = path.replace(/\/index$/, '') || '/';
  }
  
  // Process dynamic segments
  const params: string[] = [];
  if (isDynamic) {
    const matches = pagePath.match(/\[([^\]]+)\]/g) || [];
    matches.forEach(match => {
      const param = match.replace(/\[|\]/g, '');
      params.push(param);
    });
  }
  
  // Detect catch-all and optional catch-all routes
  const isCatchAll = params.some(p => p.startsWith('...'));
  const isOptionalCatchAll = params.some(p => p.startsWith('[[...'));
  
  return {
    path,
    component: filePath,
    isDynamic: isDynamic,
    hasParams: params.length > 0,
    params,
    isIndex,
    isCatchAll,
    isOptionalCatchAll,
    filePath // Add filePath property
  };
}

function generateRouterCode(routes: ReactRouterRoute[]): string {
  const imports = `import { createBrowserRouter } from "react-router-dom";\n\n`;
  
  const routesArray = routes
    .map(route => `  { path: "${route.path}", element: ${route.element} }`)
    .join(',\n');
  
  const definition = `export const router = createBrowserRouter([\n${routesArray}\n]);\n`;
  
  return imports + definition;
}
