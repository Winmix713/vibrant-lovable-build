import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { BabelCompatTypes } from '@/types/conversion';

// Helper for Babel type compatibility
const babelTypes: Partial<BabelCompatTypes['types']> = t;

export interface AstTransformOptions {
  syntax: 'typescript' | 'javascript';
  preserveComments: boolean;
  target: 'react-vite' | 'react-cra';
}

type TransformResult = {
  code: string;
  warnings: string[];
  changes: string[];
};

type CodeAnalysisResult = {
  imports: string[];
  exports: string[];
  components: string[];
  hooks: string[];
  hasNextImports: boolean;
  hasApiRoutes: boolean;
};

/**
 * AST-based transformation from Next.js code to React code
 */
export function transformWithAst(
  sourceCode: string,
  options: Partial<AstTransformOptions> = {}
): TransformResult {
  const warnings: string[] = [];
  const changes: string[] = [];
  
  const defaultOptions: AstTransformOptions = {
    syntax: 'typescript',
    preserveComments: true,
    target: 'react-vite'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    // Parse code to AST
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: [
        opts.syntax === 'typescript' ? 'typescript' : null,
        'jsx',
        'decorators-legacy',
        'classProperties'
      ].filter(Boolean) as parser.ParserPlugin[],
      tokens: true
    });
    
    // Transform Next.js specific imports
    traverse(ast, {
      ImportDeclaration: transformImportDeclaration(changes),
      VariableDeclarator: transformVariableDeclarator(changes),
      ExportNamedDeclaration: transformExportNamedDeclaration(changes),
      JSXElement: transformJSXElement(changes, warnings),
      MemberExpression: transformMemberExpression(changes),
      CallExpression: transformCallExpression(changes)
    });
    
    // Generate transformed code
    const output = generate(ast, {
      comments: opts.preserveComments,
      compact: false,
      jsescOption: {
        minimal: true
      }
    });
    
    return {
      code: output.code,
      warnings,
      changes
    };
    
  } catch (error) {
    console.error('AST transformation error:', error);
    warnings.push(`AST transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      code: sourceCode,
      warnings,
      changes: []
    };
  }
}

/**
 * Transform Next.js import declarations
 */
function transformImportDeclaration(changes: string[]) {
  return function(path: any) {
    const source = path.node.source.value;
    
    // Transform Next.js imports
    if (source === 'next/image') {
      path.node.source.value = '@unpic/react';
      changes.push('next/image import transformed to @unpic/react import');
    } else if (source === 'next/link') {
      path.node.source.value = 'react-router-dom';
      changes.push('next/link import transformed to react-router-dom import');
    } else if (source === 'next/head') {
      path.node.source.value = 'react-helmet-async';
      changes.push('next/head import transformed to react-helmet-async import');
    } else if (source === 'next/router') {
      path.node.source.value = 'react-router-dom';
      changes.push('next/router import transformed to react-router-dom import');
    } else if (source === 'next/dynamic') {
      // Special case: replace dynamic import with React.lazy
      let hasDynamicSpecifier = false;
      for (const specifier of path.node.specifiers) {
        if ((specifier.type === 'ImportSpecifier' && 
            specifier.imported && 
            'name' in specifier.imported && 
            specifier.imported.name === 'dynamic') || 
            specifier.type === 'ImportDefaultSpecifier') {
          hasDynamicSpecifier = true;
          break;
        }
      }
      
      if (hasDynamicSpecifier) {
        // Create new import
        const reactImport = parser.parseExpression(
          `import { lazy, Suspense } from 'react'`
        ) as any;
        
        // Replace import declaration
        path.replaceWith(reactImport);
        changes.push('next/dynamic import transformed to React lazy and Suspense import');
      }
    }
  };
}

/**
 * Transform variable declarations (especially for dynamic imports)
 */
function transformVariableDeclarator(changes: string[]) {
  return function(path: any) {
    // Check if this is a dynamic function call
    if (
      path.node.init && 
      path.node.init.type === 'CallExpression' &&
      path.node.init.callee.type === 'Identifier' && 
      path.node.init.callee.name === 'dynamic'
    ) {
      // Check if dynamic argument is a function
      if (path.node.init.arguments.length > 0) {
        const arg = path.node.init.arguments[0];
        if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
          const dynamicBody = arg.body;
          
          // If function body is an import() call
          if (
            dynamicBody.type === 'CallExpression' && 
            dynamicBody.callee.type === 'Import'
          ) {
            // Only try to access value property if it's a StringLiteral
            if (dynamicBody.arguments[0].type === 'StringLiteral' && 'value' in dynamicBody.arguments[0]) {
              // Create lazy call
              const lazyCall = parser.parseExpression(
                `lazy(() => import('${dynamicBody.arguments[0].value}'))`
              );
              
              // Update init field with lazy call
              path.node.init = lazyCall as any;
              changes.push('dynamic() call transformed to lazy() call');
            }
          }
        }
      }
    }
  };
}

/**
 * Transform Next.js data fetching methods
 */
function transformExportNamedDeclaration(changes: string[]) {
  return function(path: any) {
    if (path.node.declaration) {
      let fnName = '';
      
      if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
        fnName = path.node.declaration.id.name;
      } else if (
        path.node.declaration.type === 'VariableDeclaration' &&
        path.node.declaration.declarations.length > 0 &&
        path.node.declaration.declarations[0].id &&
        path.node.declaration.declarations[0].id.type === 'Identifier'
      ) {
        fnName = path.node.declaration.declarations[0].id.name;
      }
      
      // Check for SSR/SSG function names
      if (['getServerSideProps', 'getStaticProps', 'getStaticPaths'].includes(fnName)) {
        // Determine new hook name
        const reactQueryFnName = fnName === 'getServerSideProps' 
          ? 'useFetchData' 
          : (fnName === 'getStaticProps' ? 'useStaticData' : 'useAvailablePaths');
        
        // Create new hook using parseExpression
        const hookCode = `
          function ${reactQueryFnName}() {
            return useQuery({
              queryKey: ['${fnName.toLowerCase()}'],
              queryFn: async () => {
                // Original ${fnName} logic
                return { props: {} };
              }
            });
          }
        `;
        
        const newHookAst = parser.parse(hookCode, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx']
        });
        
        // Extract first statement (function declaration)
        if (newHookAst.program.body[0]) {
          const hookDeclaration = newHookAst.program.body[0];
          
          // Create new export named declaration
          const exportDecl = t.exportNamedDeclaration(
            hookDeclaration as any,
            []
          );
          
          // Replace old export with new one
          path.replaceWith(exportDecl as any);
          
          changes.push(`${fnName} transformed to React Query ${reactQueryFnName} hook`);
        }
      }
    }
  };
}

/**
 * Transform Next.js JSX components
 */
function transformJSXElement(changes: string[], warnings: string[]) {
  return function(path: any) {
    const openingElement = path.node.openingElement;
    const closingElement = path.node.closingElement;
    
    if (openingElement && openingElement.name && openingElement.name.type === 'JSXIdentifier') {
      const tagName = openingElement.name.name;
      
      // Transform Next.js Image component
      if (tagName === 'Image') {
        // Name stays the same (@unpic/react Image)
        
        // Handle src and href attributes
        const newAttributes = openingElement.attributes.filter((attr: any) => {
          if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
            // Skip priority and placeholder attributes
            if (['priority', 'placeholder'].includes(attr.name.name)) {
              warnings.push(`Image component '${attr.name.name}' property is not supported in @unpic/react library.`);
              return false;
            }
          }
          return true;
        });
        
        // Check for layout attribute
        let hasLayout = false;
        for (const attr of newAttributes) {
          if (attr.type === 'JSXAttribute' && 
              attr.name.type === 'JSXIdentifier' && 
              attr.name.name === 'layout') {
            hasLayout = true;
            break;
          }
        }
        
        // If no layout, add one
        if (!hasLayout) {
          const layoutAttr = parser.parseExpression('layout="responsive"') as any;
          newAttributes.push(layoutAttr);
        }
        
        // Update attributes
        openingElement.attributes = newAttributes;
        
        changes.push('Next.js Image component transformed to @unpic/react Image component');
      } 
      // Transform Next.js Link component
      else if (tagName === 'Link') {
        // Name stays the same (React Router Link name is also Link)
        
        // Transform href attribute to to attribute
        const newAttributes = openingElement.attributes.filter((attr: any) => {
          if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
            // Skip passHref and legacyBehavior attributes
            if (['passHref', 'legacyBehavior'].includes(attr.name.name)) {
              return false;
            }
            
            // Transform href to to
            if (attr.name.name === 'href') {
              attr.name.name = 'to';
            }
          }
          return true;
        });
        
        // Update attributes
        openingElement.attributes = newAttributes;
        
        changes.push('Next.js Link component transformed to React Router Link component');
      }
      // Transform Next.js Head component
      else if (tagName === 'Head') {
        openingElement.name.name = 'Helmet';
        
        if (closingElement && closingElement.name.type === 'JSXIdentifier') {
          closingElement.name.name = 'Helmet';
        }
        
        changes.push('Next.js Head component transformed to react-helmet-async Helmet component');
      }
      // Transform Next.js Script component
      else if (tagName === 'Script') {
        openingElement.name.name = 'script';
        
        // Transform strategy attribute
        const newAttributes = openingElement.attributes.filter((attr: any) => {
          if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
            if (attr.name.name === 'strategy') {
              if (attr.value && 
                  attr.value.type === 'StringLiteral' && 
                  attr.value.value === 'lazyOnload') {
                // Use defer attribute instead
                const deferAttr = parser.parseExpression('defer={true}') as any;
                openingElement.attributes.push(deferAttr);
              }
              return false;
            }
          }
          return true;
        });
        
        // Update attributes
        openingElement.attributes = newAttributes;
        
        if (closingElement && closingElement.name.type === 'JSXIdentifier') {
          closingElement.name.name = 'script';
        }
        
        changes.push('Next.js Script component transformed to standard script element');
      }
    }
  };
}

/**
 * Transform router usage
 */
function transformMemberExpression(changes: string[]) {
  return function(path: any) {
    if (
      path.node.object.type === 'Identifier' &&
      path.node.object.name === 'router'
    ) {
      if (
        path.node.property.type === 'Identifier' &&
        path.node.property.name === 'push'
      ) {
        path.replaceWith(t.identifier('navigate') as any);
        changes.push('router.push transformed to navigate function call');
      } else if (
        path.node.property.type === 'Identifier' &&
        path.node.property.name === 'query'
      ) {
        path.replaceWith(t.identifier('params') as any);
        changes.push('router.query transformed to params');
      } else if (
        path.node.property.type === 'Identifier' &&
        (path.node.property.name === 'asPath' || path.node.property.name === 'pathname')
      ) {
        const locationPathname = parser.parseExpression('location.pathname') as any;
        path.replaceWith(locationPathname);
        changes.push('router.pathname/asPath transformed to location.pathname');
      }
    }
  };
}

/**
 * Transform Next.js router method calls
 */
function transformCallExpression(changes: string[]) {
  return function(path: any) {
    // Transform router.replace() to navigate(path, { replace: true })
    if (
      path.node.callee.type === 'MemberExpression' &&
      path.node.callee.object.type === 'Identifier' &&
      path.node.callee.object.name === 'router' &&
      path.node.callee.property.type === 'Identifier' &&
      path.node.callee.property.name === 'replace' &&
      path.node.arguments.length > 0
    ) {
      // New call code
      const navigateExpr = `navigate(path, { replace: true })`;
      const newCall = parser.parseExpression(navigateExpr.replace('path', generate(path.node.arguments[0]).code)) as any;
      
      path.replaceWith(newCall);
      changes.push('router.replace() transformed to navigate(path, { replace: true })');
    }
    
    // Transform router.back() to navigate(-1)
    if (
      path.node.callee.type === 'MemberExpression' &&
      path.node.callee.object.type === 'Identifier' &&
      path.node.callee.object.name === 'router' &&
      path.node.callee.property.type === 'Identifier' &&
      path.node.callee.property.name === 'back'
    ) {
      const navigateExpr = `navigate(-1)`;
      const newCall = parser.parseExpression(navigateExpr) as any;
      
      path.replaceWith(newCall);
      changes.push('router.back() transformed to navigate(-1)');
    }
    
    // Transform useRouter() to the three React Router hooks
    if (
      path.node.callee.type === 'Identifier' &&
      path.node.callee.name === 'useRouter'
    ) {
      // Special handling if this is in a variable declaration
      if (
        path.parent && 
        path.parent.type === 'VariableDeclarator' && 
        path.parent.id.type === 'Identifier' &&
        path.parent.id.name === 'router'
      ) {
        // Find the parent variable declaration
        const varDeclPath = path.findParent((p: any) => p.isVariableDeclaration());
        
        if (varDeclPath) {
          // New hooks code
          const hooksCode = `
            const navigate = useNavigate();
            const params = useParams();
            const location = useLocation();
          `;
          
          const newHooks = parser.parse(hooksCode, {
            sourceType: 'module'
          });
          
          // Replace hook call in program body
          const program = path.findParent((p: any) => p.isProgram());
          if (program && 'body' in program.node) {
            // Find variable declaration index
            const declarations = program.node.body;
            for (let i = 0; i < declarations.length; i++) {
              if (declarations[i] === varDeclPath.node) {
                // Insert new hooks
                declarations.splice(i, 1, ...(newHooks.program.body as any[]));
                break;
              }
            }
          }
          
          changes.push('useRouter() hook transformed to useNavigate, useParams and useLocation hooks');
        }
      }
    }
  };
}

/**
 * Analyze code structure for deeper examination
 */
export function analyzeCodeStructure(code: string): CodeAnalysisResult {
  const imports: string[] = [];
  const exports: string[] = [];
  const components: string[] = [];
  const hooks: string[] = [];
  let hasNextImports = false;
  let hasApiRoutes = false;
  
  try {
    // AST analysis
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'] as parser.ParserPlugin[],
    });
    
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value as string;
        imports.push(source);
        
        // Detect Next.js imports
        if (source.startsWith('next/')) {
          hasNextImports = true;
        }
      },
      
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
            exports.push(path.node.declaration.id.name);
            
            // Detect Next.js API routes
            if (path.node.declaration.id.name === 'handler') {
              hasApiRoutes = true;
            }
          } else if (path.node.declaration.type === 'VariableDeclaration') {
            path.node.declaration.declarations.forEach((decl: any) => {
              if (decl.id.type === 'Identifier') {
                exports.push(decl.id.name);
                
                // Detect SSR/SSG functions
                if (['getServerSideProps', 'getStaticProps', 'getStaticPaths'].includes(decl.id.name)) {
                  hasApiRoutes = true;
                }
              }
            });
          }
        }
      },
      
      ExportDefaultDeclaration(path) {
        if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
          exports.push(path.node.declaration.id.name);
          
          // Detect Next.js API routes
          if (path.node.declaration.id.name === 'handler') {
            hasApiRoutes = true;
          }
        } else if (path.node.declaration.type === 'Identifier') {
          exports.push(path.node.declaration.name);
        }
      },
      
      // Detect React components
      VariableDeclarator(path) {
        if (path.node.id.type === 'Identifier') {
          const name = path.node.id.name;
          
          // If starts with uppercase, likely a component
          if (name[0] === name[0].toUpperCase()) {
            // Check if it's JSX or a function that returns JSX
            let isComponent = false;
            
            if (path.node.init && (path.node.init.type === 'ArrowFunctionExpression' || path.node.init.type === 'FunctionExpression')) {
              // Lower level check for JSX elements
              if (path.node.init.body && path.node.init.body.type === 'BlockStatement') {
                const blockStatements = path.node.init.body.body;
                // Check if there's a return JSX
                for (const stmt of blockStatements) {
                  if (stmt.type === 'ReturnStatement' && 
                      stmt.argument && 
                      stmt.argument.type && 
                      stmt.argument.type.includes('JSX')) {
                    isComponent = true;
                    break;
                  }
                }
              } else if (path.node.init.body && path.node.init.body.type && path.node.init.body.type.includes('JSX')) {
                isComponent = true;
              }
            }
            
            if (isComponent) {
              components.push(name);
            }
          }
          
          // Detect hooks (functions prefixed with 'use')
          if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
            hooks.push(name);
          }
        }
      },
      
      // Handle function declarations (components and hooks)
      FunctionDeclaration(path) {
        if (path.node.id) {
          const name = path.node.id.name;
          
          // Components (names starting with uppercase)
          if (name[0] === name[0].toUpperCase()) {
            // Check function body for JSX presence
            let hasJsx = false;
            if (path.node.body && path.node.body.type === 'BlockStatement') {
              const blockStatements = path.node.body.body;
              // Check for return JSX
              for (const stmt of blockStatements) {
                if (stmt.type === 'ReturnStatement' && 
                    stmt.argument && 
                    stmt.argument.type && 
                    stmt.argument.type.includes('JSX')) {
                  hasJsx = true;
                  break;
                }
              }
            }
            
            if (hasJsx) {
              components.push(name);
            }
          }
          
          // Hooks (functions prefixed with 'use')
          if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
            hooks.push(name);
          }
        }
      }
    });
    
    return {
      imports,
      exports,
      components,
      hooks,
      hasNextImports,
      hasApiRoutes
    };
    
  } catch (error) {
    console.error('Code structure analysis error:', error);
    return {
      imports: [],
      exports: [],
      components: [],
      hooks: [],
      hasNextImports: false,
      hasApiRoutes: false
    };
  }
}

/**
 * Transform complex Next.js page components with additional imports
 */
export function transformPageComponent(code: string): {
  code: string;
  warnings: string[];
  changes: string[];
  addedImports: string[];
} {
  // Perform basic transformation
  const { code: transformedCode, warnings, changes } = transformWithAst(code);
  
  // Analyze code structure
  const codeStructure = analyzeCodeStructure(transformedCode);
  
  const addedImports: string[] = [];
  
  // Add React Query import if needed
  if (
    changes.some(change => change.includes('React Query')) &&
    !codeStructure.imports.includes('@tanstack/react-query')
  ) {
    addedImports.push('import { useQuery } from "@tanstack/react-query";');
  }
  
  // Add React Router imports if needed
  if (
    changes.some(change => change.includes('React Router')) &&
    !codeStructure.imports.includes('react-router-dom')
  ) {
    addedImports.push('import { useNavigate, useParams, useLocation } from "react-router-dom";');
  }
  
  // Add @unpic/react import if needed
  if (
    changes.some(change => change.includes('@unpic/react')) &&
    !codeStructure.imports.includes('@unpic/react')
  ) {
    addedImports.push('import { Image } from "@unpic/react";');
  }
  
  // Add react-helmet-async import if needed
  if (
    changes.some(change => change.includes('react-helmet-async')) &&
    !codeStructure.imports.includes('react-helmet-async')
  ) {
    addedImports.push('import { Helmet } from "react-helmet-async";');
  }
  
  // Add React Suspense import if needed
  if (
    changes.some(change => change.includes('React lazy')) &&
    !codeStructure.imports.some(imp => imp === 'react' && imp.includes('lazy'))
  ) {
    addedImports.push('import { lazy, Suspense } from "react";');
  }
  
  // Add imports to the transformed code
  const result = addedImports.length > 0
    ? addedImports.join('\n') + '\n\n' + transformedCode
    : transformedCode;
  
  return {
    code: result,
    warnings,
    changes,
    addedImports
  };
}

/**
 * Export AST transformer API
 */
export const AstTransformer = {
  transform: transformWithAst,
  
  // Helper functions for different types of conversions
  transformNextImage: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextLink: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextRouter: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextHead: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformGetServerSideProps: (code: string) => transformWithAst(code, { preserveComments: true }),
};
