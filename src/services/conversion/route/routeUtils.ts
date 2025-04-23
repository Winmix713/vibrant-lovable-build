
import { RouteObject } from "react-router-dom";
import { NextJsRoute } from "./types";

export function getLayoutBasePath(layoutFile: string | undefined): string {
  if (!layoutFile) return '/';
  return layoutFile
    .replace(/^pages/, '')
    .replace(/\/_layout\.(tsx|jsx|js|ts)$/, '');
}

export function getComponentName(routePath: string): string {
  return routePath
    .replace(/^pages\//, '')
    .replace(/\/(index)?$/, '')
    .split('/')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .replace(/\W+/g, '')
    .replace(/^\d+/, '') || 'Page';
}

export function createRouteObject(route: NextJsRoute, isChildRoute: boolean = false): RouteObject {
  let reactPath = route.path;
  
  if (route.isIndex && isChildRoute) {
    reactPath = '';
  }
  
  if (route.isDynamic) {
    if (route.isOptionalCatchAll) {
      route.params?.forEach(param => {
        const paramName = param.replace('...', '');
        reactPath = reactPath.replace(`[[...${paramName}]]`, '*');
      });
    } else if (route.isCatchAll) {
      route.params?.forEach(param => {
        const paramName = param.replace('...', '');
        reactPath = reactPath.replace(`[...${paramName}]`, '*');
      });
    } else {
      route.params?.forEach(param => {
        reactPath = reactPath.replace(`[${param}]`, `:${param}`);
      });
    }
  }
  
  reactPath = reactPath.replace(/\/+$/, '');
  if (reactPath === '') reactPath = '/';
  
  return {
    path: reactPath,
    element: `<${getComponentName(route.component)} />`
  };
}
