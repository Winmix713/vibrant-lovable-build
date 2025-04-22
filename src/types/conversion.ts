
export interface ConversionOptions {
  useReactRouter: boolean;
  convertApiRoutes: boolean;
  transformDataFetching: boolean;
  replaceComponents: boolean;
  updateDependencies: boolean;
  preserveTypeScript: boolean;
  handleMiddleware: boolean;
}

export interface RouteConversionResult {
  originalPath: string;
  convertedPath: string;
  component: string;
  imports: string[];
  code: string;
}

/**
 * Next.js specifikus típusok átalakítása a React/Vite környezetben
 * használt megfelelő típusokra
 */
export interface NextJsSpecificTypes {
  // Next.js oldal/komponens típusok
  'NextPage<P>': 'React.FC<P>';
  'NextComponentType<C, IP, P>': 'React.ComponentType<P>';
  'AppProps': 'React.PropsWithChildren<unknown>';
  'AppContext': 'React.Context<unknown>';
  'AppInitialProps': 'Record<string, unknown>';
  
  // API route típusok
  'NextApiRequest': 'Request';
  'NextApiResponse<T>': 'Response';
  'NextApiHandler<T>': '(req: Request, res: Response) => void | Promise<void>';
  
  // Adat lekérési típusok
  'GetServerSideProps<P>': 'UseQueryResult<P>';
  'GetServerSidePropsContext': 'Record<string, unknown>';
  'GetServerSidePropsResult<P>': 'Promise<P>';
  'GetStaticProps<P>': 'UseQueryResult<P>';
  'GetStaticPropsContext<Q>': 'Record<string, unknown>';
  'GetStaticPropsResult<P>': 'Promise<P>';
  'GetStaticPaths<P>': '() => Promise<{paths: P[], fallback: boolean}>';
  'GetStaticPathsResult<P>': '{paths: P[], fallback: boolean}';
  'GetStaticPathsContext': 'Record<string, unknown>';
  
  // Middleware típusok
  'NextMiddleware': '(req: Request, res: Response, next: () => void) => void';
  'NextResponse': 'Response';
  'NextRequest': 'Request';
  
  // Kép és dokumentum típusok
  'ImageProps': 'React.ImgHTMLAttributes<HTMLImageElement> & {layout?: string, objectFit?: string, objectPosition?: string, loading?: "lazy" | "eager"}';
  'DocumentContext': 'Record<string, unknown>';
  'DocumentInitialProps': 'Record<string, unknown>';
  'DocumentProps': 'React.PropsWithChildren<unknown>';
}

/**
 * TypeScript interface átalakítás definiálása
 */
export interface TypescriptTransformation {
  originalName: string;
  newName: string;
  module: string; // Az eredeti modul, pl. 'next', 'next/image'
  targetModule?: string; // A célmodul, pl. 'react', '@unpic/react'
  defaultImport: boolean; // Az eredeti import default import-e (import X from 'Y')
  inlineTransformation?: string; // Inline definíció az új típushoz
  dependencies?: string[]; // További típusfüggőségek
}

/**
 * A TypeScript típusátalakítások gyűjteménye
 */
export const typeTransformations: TypescriptTransformation[] = [
  // NextPage átalakítása React.FC-re
  {
    originalName: 'NextPage',
    newName: 'React.FC',
    module: 'next',
    targetModule: 'react',
    defaultImport: false
  },
  
  // AppProps átalakítása
  {
    originalName: 'AppProps',
    newName: 'AppProps',
    module: 'next/app',
    targetModule: undefined,
    defaultImport: false,
    inlineTransformation: `interface AppProps {
  Component: React.ComponentType;
  pageProps: any;
}`
  },

  // GetServerSideProps átalakítása React Query használatához
  {
    originalName: 'GetServerSideProps',
    newName: 'UseQueryResult',
    module: 'next',
    targetModule: '@tanstack/react-query',
    defaultImport: false,
    dependencies: ['UseQueryOptions']
  },

  // GetStaticProps átalakítása React Query használatához  
  {
    originalName: 'GetStaticProps',
    newName: 'UseQueryResult',
    module: 'next',
    targetModule: '@tanstack/react-query',
    defaultImport: false,
    dependencies: ['UseQueryOptions']
  },

  // NextApiRequest és NextApiResponse átalakítása Express típusokra
  {
    originalName: 'NextApiRequest',
    newName: 'Request',
    module: 'next',
    targetModule: 'express',
    defaultImport: false
  },
  {
    originalName: 'NextApiResponse',
    newName: 'Response',
    module: 'next',
    targetModule: 'express',
    defaultImport: false
  },

  // Image komponens típusának átalakítása
  {
    originalName: 'ImageProps',
    newName: 'ImageProps',
    module: 'next/image',
    targetModule: '@unpic/react',
    defaultImport: false
  },

  // Link komponens típusának átalakítása
  {
    originalName: 'LinkProps',
    newName: 'LinkProps',
    module: 'next/link',
    targetModule: 'react-router-dom',
    defaultImport: false,
    inlineTransformation: `interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
  state?: any;
}`
  }
];

/**
 * Generikus típuskonverziós leképezések
 */
export interface TypeMapping {
  [key: string]: string;
}

/**
 * Általános Next.js típusok átalakítása
 */
export const typeMapping: TypeMapping = {
  'NextPage<': 'React.FC<',
  'GetServerSideProps<': 'UseQueryResult<',
  'GetStaticProps<': 'UseQueryResult<',
  'NextApiRequest': 'Request',
  'NextApiResponse<': 'Response<',
  'NextConfig': 'UserConfig',
  'ImageProps': 'ImageProps',
  'LinkProps': 'LinkProps',
  'HeadProps': 'HelmetProps',
  'ScriptProps': 'React.HTMLProps<HTMLScriptElement>',
  'GetStaticPaths<': '() => Promise<{paths: '
};

/**
 * Middleware típusok definiálása
 */
export interface MiddlewareTypes {
  'EdgeMiddleware': `import { NextResponse, NextRequest } from 'next/server';

export type EdgeMiddleware = (
  request: NextRequest,
  event: {
    waitUntil: (promise: Promise<any>) => void;
  }
) => NextResponse | Response | undefined | null | void;`;

  'ApiMiddleware': `import { NextApiRequest, NextApiResponse } from 'next';

export type ApiMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => void | Promise<void>;`;

  'ExpressMiddleware': `import { Request, Response, NextFunction } from 'express';

export type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;`;
}

/**
 * Típus konverziós segédfüggvények generálása
 */
export function generateTypeHelpers(): string {
  return `import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';

// React Query típus segédfüggvények
export type FetcherResult<T> = T;
export type DataFetchingConfig<T> = {
  queryKey: (string | number | Record<string, unknown>)[];
  queryFn: () => Promise<T>;
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    retry?: boolean | number | ((failureCount: number, error: Error) => boolean);
  };
};

// Next.js kompatibilis típusok
export type AppProps = {
  Component: React.ComponentType<any>;
  pageProps: Record<string, unknown>;
};

// Redux típus segédfüggvények
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;`;
}

/**
 * Típuskonverziós hibák gyűjtője
 */
export interface TypeConversionError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  originalType: string;
  suggestedType?: string;
}

/**
 * Típuskonverziós statisztikák
 */
export interface TypeConversionStatistics {
  totalTypesProcessed: number;
  successfulConversions: number;
  failedConversions: number;
  skippedConversions: number;
  warnings: number;
  errors: TypeConversionError[];
}

/**
 * AST Babel típusok a TypeScript-hez
 * Ez segít a Babel típusok verzió különbségeinek kezelésében
 */
export interface BabelCompatTypes {
  ParserPlugin: string;
  NodePath: any;
  types: {
    identifier: (name: string) => any;
    stringLiteral: (value: string) => any;
    arrowFunctionExpression: (params: any[], body: any, async?: boolean) => any;
    objectExpression: (properties: any[]) => any;
    objectProperty: (key: any, value: any) => any;
    arrayExpression: (elements: any[]) => any;
    callExpression: (callee: any, args: any[]) => any;
    jsxAttribute: (name: any, value: any) => any;
    jsxIdentifier: (name: string) => any;
    booleanLiteral: (value: boolean) => any;
    jsxExpressionContainer: (expression: any) => any;
    numericLiteral: (value: number) => any;
    memberExpression: (object: any, property: any) => any;
    functionDeclaration: (id: any, params: any[], body: any) => any;
    blockStatement: (body: any[]) => any;
    returnStatement: (argument: any) => any;
    commentStatement: (comment: string) => any;
  };
}
