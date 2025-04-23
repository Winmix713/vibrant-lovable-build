
import { RouteObject } from "react-router-dom";

// Define ReactRouterRoute interface that extends RouteObject
export interface ReactRouterRoute extends Omit<RouteObject, 'path'> {
  path: string; // Make path required
  children?: ReactRouterRoute[];
}

export interface NextJsRoute {
  path: string;
  component: string;
  isDynamic: boolean;
  hasParams: boolean;
  params: string[];
  isIndex: boolean;
  isCatchAll: boolean;
  isOptionalCatchAll: boolean;
  filePath?: string; 
  layout?: string;
}

export interface RouteConversionResult {
  nextRoutes: NextJsRoute[];
  reactRouterRoutes: ReactRouterRoute[];
  warnings: string[];
  originalPath?: string;
  code?: string;
}
