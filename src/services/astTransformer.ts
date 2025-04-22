
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import generator from '@babel/generator';
import { TransformerOptions } from '@/types';

// Add the missing function to the t object
const babelTypes = {
  ...t,
  commentStatement: (comment: string) => {
    return {
      type: 'CommentStatement',
      value: comment
    };
  }
};

export class AstTransformer {
  private options: TransformerOptions;

  constructor(options: TransformerOptions = { preserveComments: true, typescript: true }) {
    this.options = options;
  }

  parseCode(code: string, filename: string = 'unknown.tsx') {
    try {
      return parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          this.options.typescript ? 'typescript' : null,
          'classProperties',
          'objectRestSpread',
        ].filter(Boolean) as any[],
        sourceFilename: filename,
      });
    } catch (error) {
      console.error(`Error parsing file ${filename}:`, error);
      throw error;
    }
  }

  transformNextPageToReactComponent(code: string, filename: string): string {
    const ast = this.parseCode(code, filename);
    
    let hasGetServerSideProps = false;
    let hasGetStaticProps = false;
    let hasRouter = false;
    let pageProps: any = null;
    
    // First pass: Analyze the code
    traverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        if (t.isFunctionDeclaration(declaration)) {
          if (declaration.id && declaration.id.name === 'getServerSideProps') {
            hasGetServerSideProps = true;
          } else if (declaration.id && declaration.id.name === 'getStaticProps') {
            hasGetStaticProps = true;
          }
        }
      },
      
      VariableDeclarator(path) {
        // Check for router usage
        if (
          t.isCallExpression(path.node.init) &&
          t.isIdentifier(path.node.init.callee) && 
          (path.node.init.callee.name === 'useRouter')
        ) {
          hasRouter = true;
        }
      },
      
      FunctionDeclaration(path) {
        // Look for the page component function
        if (path.parent && t.isExportDefaultDeclaration(path.parent)) {
          const params = path.node.params;
          if (params.length > 0) {
            const firstParam = params[0];
            if (t.isObjectPattern(firstParam)) {
              // Found the props destructuring
              pageProps = firstParam;
            }
          }
        }
      },
    });
    
    // Second pass: Transform the code
    traverse(ast, {
      ImportDeclaration(path) {
        // Replace Next.js imports with React Router ones
        if (
          t.isStringLiteral(path.node.source) && 
          path.node.source.value === 'next/router'
        ) {
          path.node.source.value = 'react-router-dom';
          
          // Update the imports
          path.node.specifiers = path.node.specifiers.map(specifier => {
            if (
              t.isImportSpecifier(specifier) && 
              t.isIdentifier(specifier.imported) && 
              specifier.imported.name === 'useRouter'
            ) {
              return t.importSpecifier(
                t.identifier('useNavigate'),
                t.identifier('useNavigate')
              );
            }
            return specifier;
          });
        }
      },
      
      // Remove Next.js specific exports
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        if (t.isFunctionDeclaration(declaration)) {
          if (
            declaration.id && 
            (declaration.id.name === 'getServerSideProps' || 
             declaration.id.name === 'getStaticProps')
          ) {
            path.replaceWith(declaration);
          }
        }
      },
      
      // Transform useRouter to useNavigate
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) && 
          path.node.callee.name === 'useRouter'
        ) {
          path.node.callee.name = 'useNavigate';
          
          // Add comments about the transformation
          if (this.options.preserveComments) {
            const comment = '// Transformed from useRouter to useNavigate';
            path.addComment('leading', comment);
          }
        }
      },
      
      // Transform router usage
      MemberExpression(path) {
        if (
          t.isIdentifier(path.node.object) && 
          path.node.object.name === 'router'
        ) {
          if (
            t.isIdentifier(path.node.property) && 
            path.node.property.name === 'push'
          ) {
            path.node.object.name = 'navigate';
            path.replaceWith(path.node.object);
            
            // Add comments about the transformation
            if (this.options.preserveComments) {
              const comment = '// Transformed from router.push to navigate';
              path.addComment('leading', comment);
            }
          }
        }
      },
    });
    
    // Add imports if needed
    if (hasRouter) {
      const bodyStatements = (ast as any).program.body;
      const reactImportIndex = bodyStatements.findIndex(
        (statement: any) => 
          t.isImportDeclaration(statement) && 
          t.isStringLiteral(statement.source) && 
          statement.source.value === 'react'
      );
      
      if (reactImportIndex !== -1) {
        // Add React Router import after React import
        const reactRouterImport = t.importDeclaration(
          [t.importSpecifier(t.identifier('useNavigate'), t.identifier('useNavigate'))],
          t.stringLiteral('react-router-dom')
        );
        
        bodyStatements.splice(reactImportIndex + 1, 0, reactRouterImport);
      }
    }
    
    // Generate the transformed code
    const output = generator(ast, { 
      comments: true,
      retainLines: true,
      compact: false,
    });
    
    return output.code;
  }
  
  transformReactToNextJs(code: string, filename: string): string {
    const ast = this.parseCode(code, filename);
    
    // Transform React Router imports to Next.js
    traverse(ast, {
      ImportDeclaration(path) {
        if (
          t.isStringLiteral(path.node.source) && 
          path.node.source.value === 'react-router-dom'
        ) {
          path.node.source.value = 'next/router';
          
          // Update the imports
          path.node.specifiers = path.node.specifiers.map(specifier => {
            if (
              t.isImportSpecifier(specifier) && 
              t.isIdentifier(specifier.imported) && 
              (
                specifier.imported.name === 'useNavigate' ||
                specifier.imported.name === 'useHistory'
              )
            ) {
              return t.importSpecifier(
                t.identifier('useRouter'),
                t.identifier('useRouter')
              );
            }
            return specifier;
          });
        }
      },
      
      // Transform useNavigate to useRouter
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) && 
          (
            path.node.callee.name === 'useNavigate' ||
            path.node.callee.name === 'useHistory'
          )
        ) {
          path.node.callee.name = 'useRouter';
          
          // Add comments about the transformation
          if (this.options.preserveComments) {
            const comment = `// Transformed from ${path.node.callee.name} to useRouter`;
            path.addComment('leading', comment);
          }
        }
      },
    });
    
    // Generate the transformed code
    const output = generator(ast, { 
      comments: true,
      retainLines: true,
      compact: false,
    });
    
    return output.code;
  }
}

export default AstTransformer;
