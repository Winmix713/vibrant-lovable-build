
/**
 * Types for route analysis
 */
export interface NextJsRoute {
  path: string;
  component: string;
  isDynamic: boolean;
  params: string[];
  layout?: string;
  filePath?: string;
  isIndex?: boolean;
  hasParams?: boolean;
  isCatchAll?: boolean;
  isOptionalCatchAll?: boolean;
}

export interface ReactRouterRoute {
  path: string;
  element: string;
  children?: ReactRouterRoute[];
  index?: boolean;
}

export interface RouteAnalysisResult {
  nextRoutes: NextJsRoute[];
  reactRoutes: ReactRouterRoute[];
  warnings: string[];
}

export interface RouteConversionResult {
  nextRoutes: NextJsRoute[];
  reactRouterRoutes: ReactRouterRoute[];
  warnings: string[];
  originalPath?: string;
  code?: string;
}
