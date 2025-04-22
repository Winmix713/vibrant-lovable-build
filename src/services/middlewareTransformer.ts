
import { transformCode } from './codeTransformer';
import ts from 'typescript';

export interface MiddlewareConfig {
  path: string;
  type: 'api' | 'page' | 'edge' | 'custom';
  dependencies: string[];
  source: string;
  matcher?: string[] | string;
  skipFiles?: string[];
  middlewareName?: string;
}

export interface TransformedMiddleware {
  type: MiddlewareConfig['type'];
  code: string;
  expressCode?: string;
  reactCode?: string;
  requiresInstall: string[];
  warnings: string[];
}

/**
 * Next.js middleware típusának felismerése a kód alapján
 */
export const detectMiddlewareType = (code: string): MiddlewareConfig['type'] => {
  if (code.includes('NextResponse') || code.includes('NextRequest')) {
    return 'edge';
  }
  if (code.includes('NextApiRequest') || code.includes('NextApiResponse')) {
    return 'api';
  }
  if (code.includes('getServerSideProps') || code.includes('req.cookies') || code.includes('res.redirect')) {
    return 'page';
  }
  return 'custom';
};

/**
 * Middleware átalakítása a típusától függően
 */
export const transformMiddleware = (code: string, type: MiddlewareConfig['type']): string => {
  switch (type) {
    case 'api':
      return transformApiMiddleware(code);
    case 'edge':
      return transformEdgeMiddleware(code);
    case 'page':
      return transformPageMiddleware(code);
    case 'custom':
      return transformCustomMiddleware(code);
    default:
      return code;
  }
};

/**
 * API middleware átalakítása Express/Fastify kompatibilis middleware-ré
 */
const transformApiMiddleware = (code: string): string => {
  return code
    .replace(/NextApiRequest/g, 'Request')
    .replace(/NextApiResponse/g, 'Response')
    .replace(/export\s+(const|function)\s+middleware/g, 'export const middleware = (req, res, next)')
    .replace(/return\s+NextResponse/g, 'return res')
    .replace(/res\.status\(\s*(\d+)\s*\)\.json\(\s*([^)]+)\s*\)/g, 'res.status($1).json($2)')
    .replace(/req\.cookies/g, 'req.cookies')
    .replace(/res\.setHeader\(([^,]+),\s*([^)]+)\)/g, 'res.setHeader($1, $2)')
    .replace(/res\.redirect\(([^)]+)\)/g, 'res.redirect($1)');
};

/**
 * Edge middleware átalakítása
 */
const transformEdgeMiddleware = (code: string): string => {
  return code
    .replace(/NextResponse/g, 'Response')
    .replace(/NextRequest/g, 'Request')
    .replace(/export\s+const\s+config\s*=\s*{([^}]*)}/g, '// Edge middleware configuration removed')
    .replace(/export\s+(const|function)\s+middleware/g, 'export const middleware = async (request)')
    .replace(/cookies\(\)/g, 'cookies')
    .replace(/\.get\((['"`])(.+)(['"`])\)/g, '.get($1$2$3)')
    .replace(/\.set\((['"`])(.+)(['"`]),\s*(['"`])(.+)(['"`])\)/g, '.set($1$2$3, $4$5$6)')
    .replace(/\.has\((['"`])(.+)(['"`])\)/g, '.has($1$2$3)')
    .replace(/\.rewrite\((['"`])(.+)(['"`])\)/g, '.redirect($1$2$3)')
    .replace(/\.redirect\((['"`])(.+)(['"`])\)/g, '.redirect($1$2$3)');
};

/**
 * Page middleware átalakítása React hook-ká
 */
const transformPageMiddleware = (code: string): string => {
  return `import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

${code.replace(/export\s+(const|function)\s+middleware/, 'export const useMiddleware = ')}

// Használati példa:
// const MyComponent = () => {
//   useMiddleware();
//   return <div>Protected Page</div>;
// }
`;
};

/**
 * Egyéni middleware átalakítása
 */
const transformCustomMiddleware = (code: string): string => {
  // Alap transzformációk elvégzése
  return code
    .replace(/next\/server/g, 'express')
    .replace(/NextResponse/g, 'Response')
    .replace(/cookies\(\)/g, 'cookies')
    .replace(/export\s+(const|function)\s+middleware/g, 'export const middleware = async (req, res, next)');
};

/**
 * Express middleware generálása a middleware konfigurációja alapján
 */
export const generateExpressMiddleware = (middlewareConfig: MiddlewareConfig): string => {
  const type = middlewareConfig.type;
  let expressImports = 'const express = require(\'express\');\n';
  let middleware = '';
  
  // Függőségek importálása
  middlewareConfig.dependencies.forEach(dep => {
    expressImports += `const ${dep.split('/').pop().replace(/[^a-zA-Z0-9]/g, '')} = require('${dep}');\n`;
  });
  
  // Tipus-specifikus middleware generálás
  switch (type) {
    case 'api':
      middleware = `
const apiMiddleware = (req, res, next) => {
  try {
    // API middleware logika
    ${transformApiMiddleware(middlewareConfig.source)}
    next();
  } catch (error) {
    console.error('API middleware hiba:', error);
    res.status(500).json({ error: 'Middleware hiba' });
  }
};

router.use(apiMiddleware);
`;
      break;
    case 'edge':
      middleware = `
const edgeMiddleware = async (req, res, next) => {
  try {
    // Edge middleware logika
    ${transformEdgeMiddleware(middlewareConfig.source)}
    next();
  } catch (error) {
    console.error('Edge middleware hiba:', error);
    res.status(500).json({ error: 'Middleware hiba' });
  }
};

// Middleware alkalmazása a megfelelő útvonalakhoz
${middlewareConfig.matcher ? 
  `const paths = ${JSON.stringify(middlewareConfig.matcher)};
paths.forEach(path => router.use(path, edgeMiddleware));` : 
  'router.use(edgeMiddleware);' }
`;
      break;
    case 'page':
    case 'custom':
    default:
      middleware = `
const middleware = (req, res, next) => {
  // Transzformált middleware logika
  try {
    // Middleware logika
    ${type === 'page' ? transformPageMiddleware(middlewareConfig.source) : transformCustomMiddleware(middlewareConfig.source)}
    next();
  } catch (error) {
    console.error('Middleware hiba:', error);
    res.status(500).json({ error: 'Middleware hiba' });
  }
};

router.use(middleware);
`;
  }
  
  return `${expressImports}
const router = express.Router();

${middleware}

module.exports = router;`;
};

/**
 * Middleware fájlok felderítése és elemzése
 */
export function analyzeMiddlewareFiles(files: { name: string, content: string }[]): MiddlewareConfig[] {
  const middlewareFiles: MiddlewareConfig[] = [];
  
  // Next.js middleware fájlok keresése
  for (const file of files) {
    const fileName = file.name.toLowerCase();
    
    if (
      fileName.endsWith('middleware.js') || 
      fileName.endsWith('middleware.ts') ||
      fileName.includes('middleware/') || 
      fileName.includes('middlewares/')
    ) {
      const type = detectMiddlewareType(file.content);
      const dependencies = extractDependencies(file.content);
      const matcher = extractMatcher(file.content);
      const middlewareName = extractMiddlewareName(file.content);
      
      middlewareFiles.push({
        path: file.name,
        type,
        dependencies,
        source: file.content,
        matcher,
        middlewareName
      });
    }
  }
  
  return middlewareFiles;
}

/**
 * Függőségek kinyerése a middleware forráskódjából
 */
function extractDependencies(sourceCode: string): string[] {
  const dependencyRegex = /import\s+(?:.*)\s+from\s+['"]([^'"]+)['"]/g;
  const dependencies: string[] = [];
  let match;
  
  while ((match = dependencyRegex.exec(sourceCode)) !== null) {
    const dependency = match[1];
    if (!dependency.startsWith('.') && !dependency.startsWith('next/')) {
      dependencies.push(dependency);
    }
  }
  
  return dependencies;
}

/**
 * Matcher konfiguráció kinyerése a middleware-ből
 */
function extractMatcher(sourceCode: string): string[] | undefined {
  const configRegex = /export\s+const\s+config\s*=\s*{\s*matcher\s*:\s*(\[?[^}]+\]?)\s*}/;
  const match = configRegex.exec(sourceCode);
  
  if (match) {
    try {
      // Biztonságos kiértékelés JSON-ként, ha lehetséges
      const matcherConfig = match[1].trim();
      if (matcherConfig.startsWith('[') && matcherConfig.endsWith(']')) {
        return JSON.parse(matcherConfig.replace(/'/g, '"'));
      } else if (matcherConfig.startsWith("'") || matcherConfig.startsWith('"')) {
        // Egyetlen string érték
        return [matcherConfig.replace(/['"]/g, '')];
      }
    } catch (e) {
      console.error('Hiba a matcher konfigurációt tartalmazó karakterlánc feldolgozása során:', e);
    }
  }
  
  return undefined;
}

/**
 * Middleware név kinyerése a forráskódból
 */
function extractMiddlewareName(sourceCode: string): string | undefined {
  const nameRegex = /export\s+(const|function)\s+(\w+)/;
  const match = nameRegex.exec(sourceCode);
  
  if (match) {
    return match[2];
  }
  
  return undefined;
}

/**
 * TypeScript-alapú middleware elemzés AST segítségével
 */
export function analyzeMiddlewareWithAST(sourceCode: string): {
  imports: string[];
  exports: string[];
  functions: string[];
  usesNextTools: boolean;
} {
  const imports: string[] = [];
  const exports: string[] = [];
  const functions: string[] = [];
  let usesNextTools = false;
  
  try {
    const sourceFile = ts.createSourceFile(
      'middleware.ts',
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
    
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node)) {
        const importPath = node.moduleSpecifier.getText().replace(/['"]/g, '');
        imports.push(importPath);
        
        if (importPath.startsWith('next/')) {
          usesNextTools = true;
        }
      }
      else if (ts.isExportDeclaration(node)) {
        exports.push('export declaration');
      }
      else if (ts.isFunctionDeclaration(node) && node.name) {
        functions.push(node.name.getText());
      }
      else if (ts.isVariableStatement(node) && 
               node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
        node.declarationList.declarations.forEach(decl => {
          if (decl.name) {
            exports.push(decl.name.getText());
          }
        });
      }
      
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    return {
      imports,
      exports,
      functions,
      usesNextTools
    };
  } catch (error) {
    console.error('Hiba a TypeScript AST elemzés során:', error);
    return {
      imports: [],
      exports: [],
      functions: [],
      usesNextTools: false
    };
  }
}

/**
 * Middleware konvertálása különböző célplatformokra
 */
export function convertMiddleware(middlewareConfig: MiddlewareConfig): TransformedMiddleware {
  const { type, source } = middlewareConfig;
  const transformedCode = transformMiddleware(source, type);
  const warnings: string[] = [];
  const requiresInstall: string[] = [];
  
  // Express middleware kód generálása
  const expressCode = generateExpressMiddleware(middlewareConfig);
  
  // React hook generálása, ha page típusú
  const reactCode = type === 'page' ? transformPageMiddleware(source) : undefined;
  
  // Szükséges csomagok meghatározása
  if (type === 'api' || type === 'custom') {
    requiresInstall.push('express');
  }
  
  if (type === 'edge') {
    requiresInstall.push('express');
    warnings.push('Az Edge middleware átalakítása korlátozott. Ellenőrizze a generált kódot.');
  }
  
  // Egyéni függőségek hozzáadása
  middlewareConfig.dependencies.forEach(dep => {
    if (!dep.startsWith('next/') && !requiresInstall.includes(dep)) {
      requiresInstall.push(dep);
    }
  });
  
  return {
    type,
    code: transformedCode,
    expressCode,
    reactCode,
    requiresInstall,
    warnings
  };
}

/**
 * Teljes middleware kollekció konvertálása
 */
export function convertAllMiddleware(middlewares: MiddlewareConfig[]): { 
  converted: TransformedMiddleware[],
  expressServer: string
} {
  const converted = middlewares.map(middleware => convertMiddleware(middleware));
  
  // Express szerver generálása az összes middleware használatához
  const expressServer = generateExpressServer(converted);
  
  return {
    converted,
    expressServer
  };
}

/**
 * Express szerver generálása az összes middleware használatához
 */
function generateExpressServer(middlewares: TransformedMiddleware[]): string {
  const imports = ['express', 'cors', 'body-parser', 'cookie-parser'];
  
  // Egyedi függőségek hozzáadása
  middlewares.forEach(middleware => {
    middleware.requiresInstall.forEach(dep => {
      if (!imports.includes(dep)) {
        imports.push(dep);
      }
    });
  });
  
  const importCode = imports.map(imp => `const ${imp.split('/').pop().replace(/[^a-zA-Z0-9]/g, '')} = require('${imp}');`).join('\n');
  
  return `${importCode}

const app = express();

// Middleware beállítása
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// API útvonalak
${middlewares.map((middleware, index) => `// ${middleware.type} middleware
app.use('/api/${middleware.type}-middleware-${index + 1}', require('./middleware-${index + 1}'));`).join('\n\n')}

// Szerver indítása
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`API szerver fut a http://localhost:\${PORT} címen\`);
});

module.exports = app;
`;
}
