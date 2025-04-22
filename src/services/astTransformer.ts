
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { BabelCompatTypes } from '@/types/conversion';

// Segéd függvény a Babel típus kompatibilitáshoz
const babelTypes: BabelCompatTypes['types'] = t;

export interface AstTransformOptions {
  syntax: 'typescript' | 'javascript';
  preserveComments: boolean;
  target: 'react-vite' | 'react-cra';
}

/**
 * AST alapú transzformáció Next.js kódból React kódba
 */
export function transformWithAst(
  sourceCode: string,
  options: Partial<AstTransformOptions> = {}
): { code: string; warnings: string[]; changes: string[] } {
  const warnings: string[] = [];
  const changes: string[] = [];
  
  const defaultOptions: AstTransformOptions = {
    syntax: 'typescript',
    preserveComments: true,
    target: 'react-vite'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    // Kód AST-vé alakítása
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
    
    // Next.js specifikus importok transzformálása
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        
        // Next.js importok átalakítása
        if (source === 'next/image') {
          path.node.source.value = '@unpic/react';
          changes.push('next/image import átalakítva @unpic/react importra');
        } else if (source === 'next/link') {
          path.node.source.value = 'react-router-dom';
          changes.push('next/link import átalakítva react-router-dom importra');
        } else if (source === 'next/head') {
          path.node.source.value = 'react-helmet-async';
          changes.push('next/head import átalakítva react-helmet-async importra');
        } else if (source === 'next/router') {
          path.node.source.value = 'react-router-dom';
          changes.push('next/router import átalakítva react-router-dom importra');
        } else if (source === 'next/dynamic') {
          // Speciális eset: dynamic importot React.lazy-re cseréljük
          // Ellenőrizzük a dynamic specifier jelenlétét
          let hasDynamicSpecifier = false;
          for (const specifier of path.node.specifiers) {
            if ((specifier.type === 'ImportSpecifier' && 
                specifier.imported && 
                specifier.imported.name === 'dynamic') || 
                specifier.type === 'ImportDefaultSpecifier') {
              hasDynamicSpecifier = true;
              break;
            }
          }
          
          if (hasDynamicSpecifier) {
            // Új import létrehozása
            const reactImport = parser.parseExpression(
              `import { lazy, Suspense } from 'react'`
            ) as any;
            
            // Cseréljük az import deklarációt
            path.replaceWith(reactImport);
            changes.push('next/dynamic import átalakítva React lazy és Suspense importra');
          }
        }
      },
      
      // Dynamic importok átalakítása React.lazy-re
      VariableDeclarator(path) {
        // Ellenőrizzük, hogy a dynamic függvény hívás-e
        if (
          path.node.init && 
          path.node.init.type === 'CallExpression' &&
          path.node.init.callee.type === 'Identifier' && 
          path.node.init.callee.name === 'dynamic'
        ) {
          // Ellenőrizzük, hogy a dynamic argumentuma egy függvény-e
          if (path.node.init.arguments.length > 0) {
            const arg = path.node.init.arguments[0];
            if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
              const dynamicBody = arg.body;
              
              // Ha a függvény teste egy import() hívás
              if (
                dynamicBody.type === 'CallExpression' && 
                dynamicBody.callee.type === 'Import'
              ) {
                // Létrehozzuk a lazy hívást
                const lazyCall = parser.parseExpression(
                  `lazy(() => import('${dynamicBody.arguments[0].value}'))`
                );
                
                // Frissítjük az init mezőt a lazy hívással
                path.node.init = lazyCall as any;
                changes.push('dynamic() hívás átalakítva lazy() hívásra');
              }
            }
          }
        }
      },
      
      // getServerSideProps, getStaticProps transzformálása
      ExportNamedDeclaration(path) {
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
          
          // SSR/SSG funkciónevek ellenőrzése
          if (['getServerSideProps', 'getStaticProps', 'getStaticPaths'].includes(fnName)) {
            // Új hook név meghatározása
            const reactQueryFnName = fnName === 'getServerSideProps' 
              ? 'useFetchData' 
              : (fnName === 'getStaticProps' ? 'useStaticData' : 'useAvailablePaths');
            
            // Új hook létrehozása parseExpression segítségével
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
            
            // Az első statement kinyerése (a függvény deklaráció)
            const hookDeclaration = newHookAst.program.body[0];
            
            // Új export named declaration létrehozása
            const exportDecl = t.exportNamedDeclaration(
              hookDeclaration as any,
              []
            );
            
            // A régi export cseréje az újra
            path.replaceWith(exportDecl);
            
            changes.push(`${fnName} átalakítva React Query ${reactQueryFnName} hook-ká`);
          }
        }
      },
      
      // Next.js komponensek transzformálása
      JSXElement(path) {
        const openingElement = path.node.openingElement;
        const closingElement = path.node.closingElement;
        
        if (openingElement && openingElement.name && openingElement.name.type === 'JSXIdentifier') {
          const tagName = openingElement.name.name;
          
          // Next.js Image komponens átalakítása
          if (tagName === 'Image') {
            // Név ugyanaz marad (@unpic/react Image)
            
            // src és href attribútumok kezelése
            const newAttributes = openingElement.attributes.filter(attr => {
              if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
                // Kihagyjuk a priority és placeholder attribútumokat
                if (['priority', 'placeholder'].includes(attr.name.name)) {
                  warnings.push(`Az Image komponens '${attr.name.name}' tulajdonsága nem támogatott az @unpic/react könyvtárban.`);
                  return false;
                }
              }
              return true;
            });
            
            // Layout attribútum ellenőrzése
            let hasLayout = false;
            for (const attr of newAttributes) {
              if (attr.type === 'JSXAttribute' && 
                  attr.name.type === 'JSXIdentifier' && 
                  attr.name.name === 'layout') {
                hasLayout = true;
                break;
              }
            }
            
            // Ha nincs layout, hozzáadunk egyet
            if (!hasLayout) {
              const layoutAttr = parser.parseExpression('layout="responsive"') as any;
              newAttributes.push(layoutAttr);
            }
            
            // Frissítjük az attribútumokat
            openingElement.attributes = newAttributes;
            
            changes.push('Next.js Image komponens átalakítva @unpic/react Image komponensre');
          } 
          // Next.js Link komponens átalakítása
          else if (tagName === 'Link') {
            // Név ugyanaz marad (React Router Link neve is Link)
            
            // href attribútum átalakítása to attribútummá
            const newAttributes = openingElement.attributes.filter(attr => {
              if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
                // Kihagyjuk a passHref és legacyBehavior attribútumokat
                if (['passHref', 'legacyBehavior'].includes(attr.name.name)) {
                  return false;
                }
                
                // href átalakítása to-ra
                if (attr.name.name === 'href') {
                  attr.name.name = 'to';
                }
              }
              return true;
            });
            
            // Frissítjük az attribútumokat
            openingElement.attributes = newAttributes;
            
            changes.push('Next.js Link komponens átalakítva React Router Link komponensre');
          }
          // Next.js Head komponens átalakítása
          else if (tagName === 'Head') {
            openingElement.name.name = 'Helmet';
            
            if (closingElement && closingElement.name.type === 'JSXIdentifier') {
              closingElement.name.name = 'Helmet';
            }
            
            changes.push('Next.js Head komponens átalakítva react-helmet-async Helmet komponensre');
          }
          // Next.js Script komponens átalakítása
          else if (tagName === 'Script') {
            openingElement.name.name = 'script';
            
            // strategy attribútum átalakítása
            const newAttributes = openingElement.attributes.filter(attr => {
              if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
                if (attr.name.name === 'strategy') {
                  if (attr.value && 
                      attr.value.type === 'StringLiteral' && 
                      attr.value.value === 'lazyOnload') {
                    // Helyette defer attribútumot használunk
                    const deferAttr = parser.parseExpression('defer={true}') as any;
                    openingElement.attributes.push(deferAttr);
                  }
                  return false;
                }
              }
              return true;
            });
            
            // Frissítjük az attribútumokat
            openingElement.attributes = newAttributes;
            
            if (closingElement && closingElement.name.type === 'JSXIdentifier') {
              closingElement.name.name = 'script';
            }
            
            changes.push('Next.js Script komponens átalakítva standard script elemre');
          }
        }
      },
      
      // router használat átalakítása
      MemberExpression(path) {
        if (
          path.node.object.type === 'Identifier' &&
          path.node.object.name === 'router'
        ) {
          if (
            path.node.property.type === 'Identifier' &&
            path.node.property.name === 'push'
          ) {
            path.replaceWith(t.identifier('navigate') as any);
            changes.push('router.push átalakítva navigate függvényhívásra');
          } else if (
            path.node.property.type === 'Identifier' &&
            path.node.property.name === 'query'
          ) {
            path.replaceWith(t.identifier('params') as any);
            changes.push('router.query átalakítva params-ra');
          } else if (
            path.node.property.type === 'Identifier' &&
            (path.node.property.name === 'asPath' || path.node.property.name === 'pathname')
          ) {
            const locationPathname = parser.parseExpression('location.pathname') as any;
            path.replaceWith(locationPathname);
            changes.push('router.pathname/asPath átalakítva location.pathname-re');
          }
        }
      },
      
      // router.replace() átalakítása navigate(path, { replace: true })-ra
      CallExpression(path) {
        if (
          path.node.callee.type === 'MemberExpression' &&
          path.node.callee.object.type === 'Identifier' &&
          path.node.callee.object.name === 'router' &&
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.name === 'replace' &&
          path.node.arguments.length > 0
        ) {
          // Új hívás kódja
          const navigateExpr = `navigate(path, { replace: true })`;
          const newCall = parser.parseExpression(navigateExpr.replace('path', generate(path.node.arguments[0]).code)) as any;
          
          path.replaceWith(newCall);
          changes.push('router.replace() átalakítva navigate(path, { replace: true })-ra');
        }
        
        // router.back() átalakítása navigate(-1)-re
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
          changes.push('router.back() átalakítva navigate(-1)-re');
        }
        
        // useRouter() átalakítása a három React Router hook-ra
        if (
          path.node.callee.type === 'Identifier' &&
          path.node.callee.name === 'useRouter'
        ) {
          // Ha ez egy változó deklarációban van, akkor különleges kezelés kell
          if (
            path.parent && 
            path.parent.type === 'VariableDeclarator' && 
            path.parent.id.type === 'Identifier' &&
            path.parent.id.name === 'router'
          ) {
            // Meg kell keresni a változó deklaráció szülőjét
            const varDeclPath = path.findParent(p => p.isVariableDeclaration());
            
            if (varDeclPath) {
              // Új hook-ok kódja
              const hooksCode = `
                const navigate = useNavigate();
                const params = useParams();
                const location = useLocation();
              `;
              
              const newHooks = parser.parse(hooksCode, {
                sourceType: 'module'
              });
              
              // A program törzsében cseréljük a hook hívást
              const program = path.findParent(p => p.isProgram());
              if (program && program.node.body) {
                // Megkeressük a változó deklaráció indexét
                const declarations = program.node.body;
                for (let i = 0; i < declarations.length; i++) {
                  if (declarations[i] === varDeclPath.node) {
                    // Beszúrjuk az új hook-okat
                    declarations.splice(i, 1, ...(newHooks.program.body as any[]));
                    break;
                  }
                }
              }
              
              changes.push('useRouter() hook átalakítva useNavigate, useParams és useLocation hook-okra');
            }
          }
        }
      }
    });
    
    // Generáljuk a transzformált kódot
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
    console.error('AST transzformációs hiba:', error);
    warnings.push(`AST transzformációs hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    
    return {
      code: sourceCode,
      warnings,
      changes: []
    };
  }
}

/**
 * AST transzformációs API exportálása
 */
export const AstTransformer = {
  transform: transformWithAst,
  
  // Segédfüggvények különböző típusú konverziókra
  transformNextImage: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextLink: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextRouter: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformNextHead: (code: string) => transformWithAst(code, { preserveComments: true }),
  transformGetServerSideProps: (code: string) => transformWithAst(code, { preserveComments: true }),
};

/**
 * AST elemző segédfüggvények a kód struktúra mélyebb vizsgálatához
 */
export function analyzeCodeStructure(code: string): {
  imports: string[];
  exports: string[];
  components: string[];
  hooks: string[];
  hasNextImports: boolean;
  hasApiRoutes: boolean;
} {
  const imports: string[] = [];
  const exports: string[] = [];
  const components: string[] = [];
  const hooks: string[] = [];
  let hasNextImports = false;
  let hasApiRoutes = false;
  
  try {
    // AST elemzés
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'] as parser.ParserPlugin[],
    });
    
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value as string;
        imports.push(source);
        
        // Next.js importok detektálása
        if (source.startsWith('next/')) {
          hasNextImports = true;
        }
      },
      
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
            exports.push(path.node.declaration.id.name);
            
            // Next.js API route-ok detektálása
            if (path.node.declaration.id.name === 'handler') {
              hasApiRoutes = true;
            }
          } else if (path.node.declaration.type === 'VariableDeclaration') {
            path.node.declaration.declarations.forEach(decl => {
              if (decl.id.type === 'Identifier') {
                exports.push(decl.id.name);
                
                // SSR/SSG funkciók detektálása
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
          
          // Next.js API route-ok detektálása
          if (path.node.declaration.id.name === 'handler') {
            hasApiRoutes = true;
          }
        } else if (path.node.declaration.type === 'Identifier') {
          exports.push(path.node.declaration.name);
        }
      },
      
      // React komponensek detektálása
      VariableDeclarator(path) {
        if (path.node.id.type === 'Identifier') {
          const name = path.node.id.name;
          
          // Ha nagybetűvel kezdődik, valószínűleg komponens
          if (name[0] === name[0].toUpperCase()) {
            // Ellenőrizzük, hogy JSX vagy függvény-e, ami JSX-et ad vissza
            let isComponent = false;
            
            if (path.node.init && (path.node.init.type === 'ArrowFunctionExpression' || path.node.init.type === 'FunctionExpression')) {
              // Alacsonyabb szintű ellenőrzés JSX elemekre
              if (path.node.init.body && path.node.init.body.type === 'BlockStatement') {
                const blockStatements = path.node.init.body.body;
                // Ellenőrizzük, hogy van-e benne return JSX
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
          
          // Hook-ok detektálása (use prefixű függvények)
          if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
            hooks.push(name);
          }
        }
      },
      
      // Függvény deklarációk kezelése (komponensek és hook-ok)
      FunctionDeclaration(path) {
        if (path.node.id) {
          const name = path.node.id.name;
          
          // Komponensek (nagybetűvel kezdődő nevek)
          if (name[0] === name[0].toUpperCase()) {
            // Ellenőrizzük a függvény test JSX jelenlétére
            let hasJsx = false;
            if (path.node.body && path.node.body.type === 'BlockStatement') {
              const blockStatements = path.node.body.body;
              // Ellenőrizzük, hogy van-e benne return JSX
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
          
          // Hook-ok (use prefixű függvények)
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
    console.error('Kód struktúra elemzési hiba:', error);
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
 * Optimalizált kód transzformáció komplex Next.js komponensek esetén
 */
export function transformPageComponent(code: string): {
  code: string;
  warnings: string[];
  changes: string[];
  addedImports: string[];
} {
  // Alap transzformáció elvégzése
  const { code: transformedCode, warnings, changes } = transformWithAst(code);
  
  // Kód struktúra elemzése
  const codeStructure = analyzeCodeStructure(transformedCode);
  
  const addedImports: string[] = [];
  
  // React Query import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('React Query')) &&
    !codeStructure.imports.includes('@tanstack/react-query')
  ) {
    addedImports.push('import { useQuery } from "@tanstack/react-query";');
  }
  
  // React Router importok hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('React Router')) &&
    !codeStructure.imports.includes('react-router-dom')
  ) {
    addedImports.push('import { useNavigate, useParams, useLocation } from "react-router-dom";');
  }
  
  // @unpic/react import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('@unpic/react')) &&
    !codeStructure.imports.includes('@unpic/react')
  ) {
    addedImports.push('import { Image } from "@unpic/react";');
  }
  
  // react-helmet-async import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('react-helmet-async')) &&
    !codeStructure.imports.includes('react-helmet-async')
  ) {
    addedImports.push('import { Helmet } from "react-helmet-async";');
  }
  
  // React Suspense import hozzáadása, ha szükséges
  if (
    changes.some(change => change.includes('React lazy')) &&
    !codeStructure.imports.includes('react')
  ) {
    addedImports.push('import { lazy, Suspense } from "react";');
  }
  
  // Importok hozzáadása a transzformált kódhoz
  const result = addedImports.join('\n') + '\n\n' + transformedCode;
  
  return {
    code: result,
    warnings,
    changes,
    addedImports
  };
}
