
import { RouteObject } from "react-router-dom";

export interface NextJsRoute {
  path: string;
  component: string;
  isDynamic: boolean;
  hasParams: boolean;
  params?: string[];
  layout?: string;
  isIndex?: boolean;
  isOptionalCatchAll?: boolean;
  isCatchAll?: boolean;
}

export interface RouteConversionResult {
  nextRoutes: NextJsRoute[];
  reactRouterRoutes: RouteObject[];
  warnings: string[];
  originalPath: string;
  code: string;
}

export interface LayoutMapping {
  nextPath: string;
  viteLayout: string;
}
