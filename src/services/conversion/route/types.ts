
/**
 * Types for route analysis
 */
export interface NextJsRoute {
  path: string;
  component: string;
  isDynamic: boolean;
  params: string[];
  layout?: string;
  filePath?: string; // Add the missing filePath property
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
