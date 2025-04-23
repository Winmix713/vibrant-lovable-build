
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types'; // Importáljuk a t-t
import { ErrorCollector } from '../errors/ErrorCollector';
import { transformNextImageToUnpicProps } from '../astTransformerHelper';
import { BabelTypeAdapter } from '../ast/BabelTypeAdapter';

/**
 * Transformer that uses AST to convert Next.js Image components
 * to @unpic/react Image components with advanced props handling
 */
export class AstImageTransformer {
  private errorCollector: ErrorCollector;
  
  constructor(errorCollector: ErrorCollector) {
    this.errorCollector = errorCollector;
  }
  
  /**
   * Transform Next.js Image to @unpic/react Image using AST
   */
  transformImageComponent(code: string, filePath: string): {
    code: string;
    imports: string[];
    warnings: string[];
  } {
    const result = {
      code,
      imports: ["import { Image } from '@unpic/react';"],
      warnings: [] as string[]
    };
    
    try {
      // Parse code to AST
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      // Track if we found and modified any Image components
      let imageComponentFound = false;
      let nextImageImportFound = false;
      
      // Find and replace Next.js Image imports
      traverse(ast, {
        ImportDeclaration(path) {
          const importSource = path.node.source.value;
          
          if (importSource === 'next/image') {
            nextImageImportFound = true;
            path.node.source.value = '@unpic/react';
            
            const defaultImport = path.node.specifiers.find(
              spec => BabelTypeAdapter.isValidImportSpecifier(spec)
            );
            
            if (defaultImport) {
              imageComponentFound = true;
            }
          }
        }
      });
      
      // Return early if no Next.js Image import was found
      if (!nextImageImportFound) {
        return result;
      }
      
      // Transform JSX elements
      traverse(ast, {
        JSXElement(path) {
          const openingElement = path.node.openingElement;
          
          // Check if this is an Image component
          if (t.isJSXIdentifier(openingElement.name) && 
              openingElement.name.name === 'Image') {
            
            imageComponentFound = true;
            
            // Convert Next.js Image props to @unpic/react Image props
            transformNextImageToUnpicProps(openingElement.attributes);
          }
        }
      });
      
      // Generate code from the modified AST
      if (imageComponentFound) {
        const output = generate(ast);
        result.code = output.code;
        
        // Add warnings about potentially unsupported features
        if (code.includes('placeholder="blur"') || code.includes('blurDataURL')) {
          result.warnings.push('Next.js Image blur placeholder requires additional setup with @unpic/react');
          this.errorCollector.addError({
            code: 'IMAGE_BLUR_UNSUPPORTED',
            severity: 'warning',
            message: 'Image blur placeholder requires additional setup with @unpic/react',
            file: filePath,
            suggestion: 'Consider using CSS blur filters or implement a custom blur solution'
          });
        }
      }
      
      return result;
    } catch (error) {
      // Add error to collector
      this.errorCollector.addError({
        code: 'AST_IMAGE_TRANSFORM_ERROR',
        severity: 'warning',
        message: `Error transforming Image component: ${error instanceof Error ? error.message : String(error)}`,
        file: filePath
      });
      
      // Return original code if transformation fails
      return result;
    }
  }
}
