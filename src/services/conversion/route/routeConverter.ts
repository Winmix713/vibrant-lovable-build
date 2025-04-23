
import { RouteObject } from "react-router-dom";
import { NextJsRoute, RouteConversionResult } from "./types";
import { analyzeRoutes } from "./routeAnalyzer";
import { createRouteObject, getLayoutBasePath } from "./routeUtils";

export function convertToReactRoutes(nextRoutes: NextJsRoute[]): RouteObject[] {
  const routesByLayout = new Map<string | undefined, NextJsRoute[]>();
  
  nextRoutes.forEach(route => {
    const layoutKey = route.layout || 'default';
    if (!routesByLayout.has(layoutKey)) {
      routesByLayout.set(layoutKey, []);
    }
    routesByLayout.get(layoutKey)?.push(route);
  });

  const convertedRoutes: RouteObject[] = [];
  
  // Process default routes first
  const defaultRoutes = routesByLayout.get('default') || [];
  defaultRoutes.forEach(route => {
    convertedRoutes.push(createRouteObject(route));
  });
  
  // Process routes with layouts
  routesByLayout.forEach((routes, layout) => {
    if (layout === 'default') return;
    
    const layoutRoute: RouteObject = {
      path: getLayoutBasePath(layout),
      element: `<Layout>${layout}</Layout>`,
      children: routes.map(route => createRouteObject(route, true))
    };
    
    convertedRoutes.push(layoutRoute);
  });
  
  return convertedRoutes;
}

export { analyzeRoutes };
