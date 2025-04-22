
import { RouteObject } from "react-router-dom";
import { RouteConversionResult } from "@/types/conversion";

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

// Új típus a layout kezeléshez
interface LayoutMapping {
  nextPath: string;
  viteLayout: string;
}

export function analyzeNextJsRoutes(files: File[]): NextJsRoute[] {
  const routes: NextJsRoute[] = [];
  const layouts = new Map<string, string>();
  
  // First, identify all layout files
  files.forEach(file => {
    if (file.name.match(/\/_layout\.(tsx|jsx|js|ts)$/)) {
      const dirPath = file.name.replace(/\/[^/]+$/, '');
      layouts.set(dirPath, file.name);
    }
  });
  
  files.forEach(file => {
    if (file.name.includes('pages/') && !file.name.includes('/_') && !file.name.endsWith('.css') && !file.name.endsWith('.scss')) {
      const path = file.name
        .replace(/^pages/, '')
        .replace(/\.(tsx|jsx|js|ts)$/, '')
        .replace(/\/index$/, '/');

      const isIndex = file.name.endsWith('index.tsx') || file.name.endsWith('index.jsx') || 
                       file.name.endsWith('index.js') || file.name.endsWith('index.ts');
                       
      const isOptionalCatchAll = path.includes('[[') && path.includes(']]');
      const isCatchAll = path.includes('[...') && path.includes(']');
      const isDynamic = path.includes('[') && path.includes(']');
      
      const params = isDynamic 
        ? path.match(/\[(\.{0,3}[^\]]*)\]/g)?.map(p => p.replace(/[\[\]]/g, ''))
        : [];

      // Layout detection: check parent directories for layout files
      let layoutFile = null;
      let dirPath = file.name.replace(/\/[^/]+$/, '');
      while (dirPath !== 'pages') {
        if (layouts.has(dirPath)) {
          layoutFile = layouts.get(dirPath);
          break;
        }
        dirPath = dirPath.replace(/\/[^/]+$/, '');
      }

      routes.push({
        path,
        component: file.name,
        isDynamic,
        hasParams: isDynamic,
        params,
        layout: layoutFile,
        isIndex,
        isOptionalCatchAll,
        isCatchAll
      });
    }
  });

  return routes;
}

export function convertToReactRoutes(nextRoutes: NextJsRoute[]): RouteObject[] {
  const routesByLayout = new Map<string | undefined, NextJsRoute[]>();
  
  // Csoportosítás layout szerint
  nextRoutes.forEach(route => {
    const layoutKey = route.layout || 'default';
    if (!routesByLayout.has(layoutKey)) {
      routesByLayout.set(layoutKey, []);
    }
    routesByLayout.get(layoutKey)?.push(route);
  });

  // Create nested route structure
  const convertedRoutes: RouteObject[] = [];
  
  // Process default routes (no layout) first
  const defaultRoutes = routesByLayout.get('default') || [];
  defaultRoutes.forEach(route => {
    convertedRoutes.push(createRouteObject(route));
  });
  
  // Process routes with layouts - each layout becomes a parent route
  routesByLayout.forEach((routes, layout) => {
    if (layout === 'default') return; // Already processed
    
    // Create a parent route for the layout
    const layoutRoute: RouteObject = {
      path: getLayoutBasePath(layout),
      element: `<Layout>${layout}</Layout>`,
      children: routes.map(route => createRouteObject(route, true))
    };
    
    convertedRoutes.push(layoutRoute);
  });
  
  return convertedRoutes;
}

function getLayoutBasePath(layoutFile: string | undefined): string {
  if (!layoutFile) return '/';
  
  // Extract the base path for the layout
  // pages/admin/_layout.tsx -> /admin
  return layoutFile
    .replace(/^pages/, '')
    .replace(/\/_layout\.(tsx|jsx|js|ts)$/, '');
}

function createRouteObject(route: NextJsRoute, isChildRoute: boolean = false): RouteObject {
  let reactPath = route.path;
  
  // Handle index routes
  if (route.isIndex && isChildRoute) {
    reactPath = '';
  }
  
  // Convert path params
  if (route.isDynamic) {
    // Optional catch-all routes: [[...slug]] -> *
    if (route.isOptionalCatchAll) {
      route.params?.forEach(param => {
        const paramName = param.replace('...', '');
        reactPath = reactPath.replace(`[[...${paramName}]]`, '*');
      });
    } 
    // Standard catch-all routes: [...slug] -> *
    else if (route.isCatchAll) {
      route.params?.forEach(param => {
        const paramName = param.replace('...', '');
        reactPath = reactPath.replace(`[...${paramName}]`, '*');
      });
    }
    // Dynamic parameters: [id] -> :id
    else {
      route.params?.forEach(param => {
        reactPath = reactPath.replace(`[${param}]`, `:${param}`);
      });
    }
  }
  
  // Clean up path
  reactPath = reactPath.replace(/\/+$/, ''); // Remove trailing slashes
  if (reactPath === '') reactPath = '/';
  
  const newRoute: RouteObject = {
    path: reactPath,
    element: generateRouteComponent(route)
  };
  
  return newRoute;
}

function generateRouteComponent(route: NextJsRoute): string {
  const result: RouteConversionResult = {
    originalPath: route.path,
    convertedPath: route.path.replace(/\[(\w+)\]/g, ':$1'),
    component: route.component,
    imports: [
      "import React from 'react'",
      "import { useParams, useLocation } from 'react-router-dom'"
    ],
    code: ''
  };

  if (route.isDynamic) {
    result.code = `
const ${getComponentName(route)} = () => {
  const params = useParams();
  const location = useLocation();
  
  return (
    <div>
      <h1>Dynamic Route: ${route.path}</h1>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
};`;
  } else {
    result.code = `
const ${getComponentName(route)} = () => {
  return (
    <div>
      <h1>Static Route: ${route.path}</h1>
    </div>
  );
};`;
  }

  return result.code;
}

function getComponentName(route: NextJsRoute): string {
  return route.component
    .replace(/^pages\//, '')
    .replace(/\/(index)?$/, '')
    .split('/')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .replace(/\W+/g, '')
    .replace(/^\d+/, '') || 'Page';
}

// Create route files based on analysis
export function generateReactRouteFiles(routes: NextJsRoute[]): { path: string; content: string }[] {
  const routeFiles: { path: string; content: string }[] = [];
  
  // Create the main Routes component file
  const mainRoutesFile = {
    path: 'src/routes/index.tsx',
    content: `
import React from 'react';
import { Routes, Route } from 'react-router-dom';
${routes.map(route => `import ${getComponentName(route)} from '@/pages/${getComponentName(route)}';`).join('\n')}

const AppRoutes = () => {
  return (
    <Routes>
${routes.map(route => `      <Route path="${route.path.replace(/\[(\w+)\]/g, ':$1')}" element={<${getComponentName(route)} />} />`).join('\n')}
    </Routes>
  );
};

export default AppRoutes;
`
  };
  
  routeFiles.push(mainRoutesFile);
  
  // Create individual page component files
  routes.forEach(route => {
    const componentName = getComponentName(route);
    const filePath = `src/pages/${componentName}.tsx`;
    
    let imports = ["import React from 'react'"];
    if (route.isDynamic) {
      imports.push("import { useParams, useLocation } from 'react-router-dom'");
    }
    
    let componentContent;
    if (route.isDynamic) {
      componentContent = `
const ${componentName} = () => {
  const params = useParams();
  const location = useLocation();
  
  return (
    <div>
      <h1>Dynamic Route: ${route.path}</h1>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
};`;
    } else {
      componentContent = `
const ${componentName} = () => {
  return (
    <div>
      <h1>Static Route: ${route.path}</h1>
    </div>
  );
};`;
    }
    
    const content = `${imports.join(';\n')};\n${componentContent}\n\nexport default ${componentName};`;
    
    routeFiles.push({ path: filePath, content });
  });
  
  // If there are layouts, generate layout components
  const uniqueLayouts = new Set<string>(routes.map(r => r.layout).filter(Boolean) as string[]);
  uniqueLayouts.forEach(layout => {
    const layoutName = layout.replace(/^pages\//, '')
      .replace(/\/_layout\.(tsx|jsx|js|ts)$/, '')
      .split('/')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Layout';
      
    const filePath = `src/layouts/${layoutName}.tsx`;
    
    const content = `
import React from 'react';
import { Outlet } from 'react-router-dom';

const ${layoutName} = () => {
  return (
    <div className="layout ${layoutName.toLowerCase()}">
      <header>
        <h1>${layoutName}</h1>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        ${layoutName} Footer
      </footer>
    </div>
  );
};

export default ${layoutName};
`;
    
    routeFiles.push({ path: filePath, content });
  });
  
  return routeFiles;
}
