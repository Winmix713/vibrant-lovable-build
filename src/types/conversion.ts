
// Add missing conversion result type

import { NextJsRoute } from "../services/routeConverter";

export interface ConversionOptions {
  syntax: 'typescript' | 'javascript';
  useReactRouter: boolean;
  updateDependencies: boolean;
  transformDataFetching: boolean;
  convertApiRoutes: boolean;
  replaceComponents: boolean;
  handleMiddleware: boolean;
  preserveComments: boolean;
  preserveTypeScript?: boolean; // Added this property
  target: 'react-vite' | 'react-cra';
}

export interface CICDTemplate {
  platform: string;
  config: string;
  filename: string;
  description: string;
}

export interface ConversionResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  routes: any[];
  dependencies: any[];
  transformedFiles: string[];
  originalPath?: string;
  code?: string;
  stats: {
    totalFiles: number;
    modifiedFiles: number;
    transformationRate: number;
    dependencyChanges: number;
    routeChanges: number;
  };
}

export interface RouteConversionResult {
  nextRoutes: NextJsRoute[];
  reactRouterRoutes: any[];
  warnings: string[];
  originalPath?: string;
  code?: string;
}

export interface BabelCompatTypes {
  ClassBody: any;
  EnumBooleanBody: any;
  EnumNumberBody: any;
  EnumStringBody: any;
  EnumSymbolBody: any;
  ObjectTypeAnnotation: any;
  TSTypeElement: any[];
}

export interface CICDPlatform {
  name: string;
  templates: CICDTemplate[];
}

export interface ComponentStatus {
  name: string;
  status: 'ok' | 'error';
  message?: string;
}

// AWS specific types
export interface S3Bucket {
  name: string;
  region: string;
}

export interface DomainName {
  name: string;
  zone: string;
}

export interface CloudFrontOriginAccessIdentity {
  id: string;
  name: string;
}
